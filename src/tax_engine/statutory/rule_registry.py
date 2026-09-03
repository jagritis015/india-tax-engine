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
        rule_id="SALARY_TDS", tax_year="2026-27", legislation="Income-tax Act, 2025",
        provision="Section 392", description="Deduction of tax at source from salary",
        status=VerificationStatus.VERIFIED, source_reference="Income-tax Act, 2025, section 392",
    ),
    "NEW_REGIME_RATES": StatutoryRule(
        rule_id="NEW_REGIME_RATES", tax_year="2026-27", legislation="Income-tax Act, 2025",
        provision="Section 202", description="Tax rates applicable under the new regime",
        status=VerificationStatus.VERIFIED, source_reference="Income-tax Act, 2025, section 202",
    ),
    "OLD_REGIME_RATES": StatutoryRule(
        rule_id="OLD_REGIME_RATES", tax_year="2026-27", legislation="Finance Act, 2026",
        provision="Section 3 read with Part I-B of the First Schedule",
        description="Normal rates applicable where the section 202 new-regime option is exercised",
        status=VerificationStatus.VERIFIED,
        source_reference="Finance Act, 2026, section 3 and First Schedule Part I-B",
    ),
    "REBATE": StatutoryRule(
        rule_id="REBATE", tax_year="2026-27", legislation="Income-tax Act, 2025",
        provision="Sections 155 and 156", description="Rebate and applicable marginal relief",
        status=VerificationStatus.VERIFIED, source_reference="Income-tax Act, 2025, sections 155 and 156",
    ),
    "SCHEDULE_XV_DEDUCTION": StatutoryRule(
        rule_id="SCHEDULE_XV_DEDUCTION", tax_year="2026-27", legislation="Income-tax Act, 2025",
        provision="Section 123 read with Schedule XV",
        description="Aggregate deduction cap and regime eligibility for qualifying Schedule XV payments",
        status=VerificationStatus.VERIFIED,
        source_reference="Income-tax Act, 2025, section 123 and Schedule XV; CBDT Interplay and Transition FAQs Q8.10-Q8.11",
    ),
    "HRA_EXEMPTION": StatutoryRule(
        rule_id="HRA_EXEMPTION", tax_year="2026-27", legislation="Income-tax Act, 2025 and Income-tax Rules, 2026",
        provision="Section 11 read with Schedule III Table Sl. No. 11 and Rule 279",
        description="House rent allowance exemption limits and new-regime exclusion",
        status=VerificationStatus.VERIFIED,
        source_reference="Income-tax Act, 2025, section 11, Schedule III Table Sl. No. 11 and section 202(2)(a)(i); Income-tax Rules, 2026, rule 279",
    ),
    "SURCHARGE": StatutoryRule(
        rule_id="SURCHARGE", tax_year="2026-27", legislation="Finance Act, 2026",
        provision="Section 3 read with Part I-B of the First Schedule",
        description="Income-tax surcharge and marginal relief for TY 2026-27",
        status=VerificationStatus.VERIFIED, source_reference="Finance Act, 2026, section 3 and First Schedule Part I-B",
    ),
    "HEALTH_EDUCATION_CESS": StatutoryRule(
        rule_id="HEALTH_EDUCATION_CESS", tax_year="2026-27", legislation="Finance Act, 2026",
        provision="Section 3 and applicable First Schedule provisions",
        description="Health and Education Cess at 4% on income-tax plus surcharge",
        status=VerificationStatus.VERIFIED, source_reference="Finance Act, 2026",
    ),
    "ROUNDING": StatutoryRule(
        rule_id="ROUNDING", tax_year="2026-27", legislation="Income-tax Act, 2025",
        provision="Section 516",
        description="Rounding of total income and amounts payable or refundable to the nearest multiple of ten rupees",
        status=VerificationStatus.VERIFIED, source_reference="Income-tax Act, 2025, section 516",
    ),
}
