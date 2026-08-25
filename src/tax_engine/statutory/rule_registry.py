from dataclasses import dataclass
from enum import Enum


class VerificationStatus(str, Enum):
    VERIFIED = "verified"
    REVIEW_REQUIRED = "review_required"
    NOT_IMPLEMENTED = "not_implemented"


@dataclass(frozen=True)
class StatutoryRule:
    rule_id: str
    tax_year: str
    legislation: str
    provision: str
    description: str
    status: VerificationStatus
    source_reference: str


TY_2026_27_RULES = {
    "SALARY_TDS": StatutoryRule(
        rule_id="SALARY_TDS",
        tax_year="2026-27",
        legislation="Income-tax Act, 2025",
        provision="Section 392",
        description="Deduction of tax at source from salary",
        status=VerificationStatus.VERIFIED,
        source_reference="Income-tax Act, 2025, section 392",
    ),
    "NEW_REGIME_RATES": StatutoryRule(
        rule_id="NEW_REGIME_RATES",
        tax_year="2026-27",
        legislation="Income-tax Act, 2025",
        provision="Section 202",
        description="Tax rates applicable under the new regime",
        status=VerificationStatus.VERIFIED,
        source_reference="Income-tax Act, 2025, section 202",
    ),
    "REBATE": StatutoryRule(
        rule_id="REBATE",
        tax_year="2026-27",
        legislation="Income-tax Act, 2025",
        provision="Section 156",
        description="Rebate and applicable marginal relief",
        status=VerificationStatus.VERIFIED,
        source_reference="Income-tax Act, 2025, section 156",
    ),
    "SCHEDULE_XV_DEDUCTION": StatutoryRule(
        rule_id="SCHEDULE_XV_DEDUCTION",
        tax_year="2026-27",
        legislation="Income-tax Act, 2025",
        provision="Section 123 read with Schedule XV",
        description="Specified deductions under Schedule XV",
        status=VerificationStatus.REVIEW_REQUIRED,
        source_reference="Income-tax Act, 2025, section 123 and Schedule XV",
    ),
    "HRA_EXEMPTION": StatutoryRule(
        rule_id="HRA_EXEMPTION",
        tax_year="2026-27",
        legislation="Income-tax Act, 2025",
        provision="Salary exemption provisions and applicable rules",
        description="House rent allowance exemption",
        status=VerificationStatus.REVIEW_REQUIRED,
        source_reference="Income-tax Act, 2025 and Income-tax Rules, 2026",
    ),
    "SURCHARGE": StatutoryRule(
        rule_id="SURCHARGE",
        tax_year="2026-27",
        legislation="Finance Act applicable to TY 2026-27",
        provision="Applicable rate schedule",
        description="Income-tax surcharge and marginal relief",
        status=VerificationStatus.NOT_IMPLEMENTED,
        source_reference="Applicable Finance Act",
    ),
}
