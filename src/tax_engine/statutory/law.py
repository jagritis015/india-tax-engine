from dataclasses import dataclass
from datetime import date
from enum import Enum


class IncomeTaxAct(str, Enum):
    ACT_1961 = "income_tax_act_1961"
    ACT_2025 = "income_tax_act_2025"


@dataclass(frozen=True)
class IncomeTaxLawContext:
    act: IncomeTaxAct
    period_label: str
    period_start: date
    period_end: date
    assessment_year: str | None

    @property
    def tax_year(self) -> str:
        return self.period_label


_NEW_ACT_START = date(2026, 4, 1)


def income_tax_law_context(period_start: date) -> IncomeTaxLawContext:
    """Resolve the governing Income-tax Act and statutory year terminology.

    Periods beginning before 1 April 2026 remain governed by the Income-tax Act,
    1961. Periods beginning on or after 1 April 2026 use the Income-tax Act, 2025
    and Tax Year terminology; Assessment Year is deliberately absent there.
    """

    start_year = period_start.year if period_start.month >= 4 else period_start.year - 1
    period_start_date = date(start_year, 4, 1)
    period_end_date = date(start_year + 1, 3, 31)
    label = f"{start_year}-{str(start_year + 1)[-2:]}"

    if period_start_date >= _NEW_ACT_START:
        return IncomeTaxLawContext(
            act=IncomeTaxAct.ACT_2025,
            period_label=label,
            period_start=period_start_date,
            period_end=period_end_date,
            assessment_year=None,
        )

    assessment_year = f"{start_year + 1}-{str(start_year + 2)[-2:]}"
    return IncomeTaxLawContext(
        act=IncomeTaxAct.ACT_1961,
        period_label=label,
        period_start=period_start_date,
        period_end=period_end_date,
        assessment_year=assessment_year,
    )
