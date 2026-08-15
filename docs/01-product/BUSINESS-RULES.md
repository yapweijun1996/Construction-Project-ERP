# BUSINESS RULES

Status: Approved baseline

**BR-PROJECT-001** Project is primary context.

**BR-CONTRACT-001** Adjusted Contract = Original Contract + signed approved commercial changes.

**BR-CONTRACT-002** Work packages may be service, lump-sum, milestone, material or adjustment.

**BR-CONTRACT-003** Certified/billed history is not silently overwritten; revisions create adjustments.

**BR-FULFIL-001** Physical Material may require DO/delivery evidence.

**BR-FULFIL-002** Progress-Based Work uses measurement/certification, not automatic DO.

**BR-CLAIM-001** Current Claim is current-period movement, not cumulative.

**BR-CLAIM-002** Cumulative Entitlement is separately visible/derivable.

**BR-CLAIM-003** Previous Certificate is prior certification, not payment.

**BR-CLAIM-004** Claim, Certification, Billing and Collection are separate stages.

**BR-CLAIM-005** Retention, On Hold and Advance Recovery are explicit fields.

**BR-CLAIM-006** Negative current claim is valid.

**BR-CERT-001** Certified may differ from Claimed.

**BR-AR-001** Certified != Invoiced != Collected.

**BR-AR-002** Negative certification creates explicit AR credit treatment in demo v1.

**BR-AR-003** Existing AR credit is applied during allocation, not deducted again in next PCAR.

**BR-COST-001** Claim progress != accounting POC.

**BR-DEMO-001** Public demo data is fictional.

**BR-DEMO-002** Seed is deterministic and resettable.
