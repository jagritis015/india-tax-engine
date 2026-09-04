import sqlite3
from datetime import datetime
from pathlib import Path

from tax_engine.platform.audit import AccessAuditEvent
from tax_engine.platform.identity import MembershipRecord
from tax_engine.platform.tenancy import Role


class SQLitePlatformStore:
    """SQLite-backed tenant identity directory and authorization audit sink.

    The database owns identity uniqueness and tenant relationships. This adapter
    is intentionally synchronous because the surrounding service contracts are
    synchronous; a server deployment can replace it without changing callers.
    """

    def __init__(self, database: str | Path) -> None:
        self._connection = sqlite3.connect(str(database))
        self._connection.row_factory = sqlite3.Row
        self._connection.execute("PRAGMA foreign_keys = ON")
        self._connection.execute("PRAGMA busy_timeout = 5000")
        self._create_schema()

    def _create_schema(self) -> None:
        self._connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS companies (
                company_id TEXT PRIMARY KEY,
                name TEXT NOT NULL CHECK (length(name) > 0),
                active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
            );

            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                email TEXT,
                active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
            );

            CREATE TABLE IF NOT EXISTS memberships (
                provider TEXT NOT NULL,
                subject TEXT NOT NULL,
                user_id TEXT NOT NULL REFERENCES users(user_id),
                company_id TEXT NOT NULL REFERENCES companies(company_id),
                role TEXT NOT NULL,
                employee_id TEXT,
                active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
                PRIMARY KEY (provider, subject),
                CHECK (role IN (
                    'employee', 'hr', 'payroll', 'finance',
                    'compliance', 'admin', 'leadership'
                )),
                CHECK (role != 'employee' OR employee_id IS NOT NULL)
            );

            CREATE INDEX IF NOT EXISTS memberships_company_id_idx
                ON memberships(company_id);

            CREATE TABLE IF NOT EXISTS access_audit_events (
                event_id INTEGER PRIMARY KEY AUTOINCREMENT,
                occurred_at TEXT NOT NULL,
                user_id TEXT NOT NULL,
                company_id TEXT NOT NULL,
                action TEXT NOT NULL,
                resource_type TEXT NOT NULL,
                resource_id TEXT NOT NULL,
                allowed INTEGER NOT NULL CHECK (allowed IN (0, 1)),
                reason TEXT
            );

            CREATE INDEX IF NOT EXISTS audit_company_time_idx
                ON access_audit_events(company_id, occurred_at);

            CREATE TRIGGER IF NOT EXISTS access_audit_events_no_update
            BEFORE UPDATE ON access_audit_events
            BEGIN
                SELECT RAISE(ABORT, 'access audit events are immutable');
            END;

            CREATE TRIGGER IF NOT EXISTS access_audit_events_no_delete
            BEFORE DELETE ON access_audit_events
            BEGIN
                SELECT RAISE(ABORT, 'access audit events are immutable');
            END;
            """
        )
        self._connection.commit()

    def save_company(self, *, company_id: str, name: str, active: bool = True) -> None:
        if not company_id or not name:
            raise ValueError("company_id and name are required")
        try:
            with self._connection:
                self._connection.execute(
                    "INSERT INTO companies(company_id, name, active) VALUES (?, ?, ?)",
                    (company_id, name, active),
                )
        except sqlite3.IntegrityError as exc:
            raise ValueError("company is already registered") from exc

    def save_user(
        self,
        *,
        user_id: str,
        email: str | None = None,
        active: bool = True,
    ) -> None:
        if not user_id:
            raise ValueError("user_id is required")
        try:
            with self._connection:
                self._connection.execute(
                    "INSERT INTO users(user_id, email, active) VALUES (?, ?, ?)",
                    (user_id, email, active),
                )
        except sqlite3.IntegrityError as exc:
            raise ValueError("user is already registered") from exc

    def save(self, membership: MembershipRecord) -> None:
        try:
            with self._connection:
                self._connection.execute(
                    """
                    INSERT INTO memberships(
                        provider, subject, user_id, company_id, role, employee_id, active
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        membership.provider,
                        membership.subject,
                        membership.user_id,
                        membership.company_id,
                        membership.role.value,
                        membership.employee_id,
                        membership.active,
                    ),
                )
        except sqlite3.IntegrityError as exc:
            message = str(exc).lower()
            if "unique" in message:
                raise ValueError("provider subject is already mapped") from exc
            raise ValueError("membership references an unknown user or company") from exc

    def find_membership(
        self,
        *,
        provider: str,
        subject: str,
    ) -> MembershipRecord | None:
        row = self._connection.execute(
            """
            SELECT m.user_id, m.provider, m.subject, m.company_id, m.role,
                   m.employee_id, m.active
            FROM memberships AS m
            JOIN users AS u ON u.user_id = m.user_id
            JOIN companies AS c ON c.company_id = m.company_id
            WHERE m.provider = ? AND m.subject = ?
              AND m.active = 1 AND u.active = 1 AND c.active = 1
            """,
            (provider, subject),
        ).fetchone()
        if row is None:
            return None
        return MembershipRecord(
            user_id=row["user_id"],
            provider=row["provider"],
            subject=row["subject"],
            company_id=row["company_id"],
            role=Role(row["role"]),
            employee_id=row["employee_id"],
            active=bool(row["active"]),
        )

    def record(self, event: AccessAuditEvent) -> None:
        with self._connection:
            self._connection.execute(
                """
                INSERT INTO access_audit_events(
                    occurred_at, user_id, company_id, action, resource_type,
                    resource_id, allowed, reason
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    event.occurred_at.isoformat(),
                    event.user_id,
                    event.company_id,
                    event.action,
                    event.resource_type,
                    event.resource_id,
                    event.allowed,
                    event.reason,
                ),
            )

    def list_audit_events(self, *, company_id: str) -> list[AccessAuditEvent]:
        rows = self._connection.execute(
            """
            SELECT occurred_at, user_id, company_id, action, resource_type,
                   resource_id, allowed, reason
            FROM access_audit_events
            WHERE company_id = ?
            ORDER BY event_id
            """,
            (company_id,),
        ).fetchall()
        return [
            AccessAuditEvent(
                occurred_at=datetime.fromisoformat(row["occurred_at"]),
                user_id=row["user_id"],
                company_id=row["company_id"],
                action=row["action"],
                resource_type=row["resource_type"],
                resource_id=row["resource_id"],
                allowed=bool(row["allowed"]),
                reason=row["reason"],
            )
            for row in rows
        ]

    def close(self) -> None:
        self._connection.close()

    def __enter__(self) -> "SQLitePlatformStore":
        return self

    def __exit__(self, *_args: object) -> None:
        self.close()
