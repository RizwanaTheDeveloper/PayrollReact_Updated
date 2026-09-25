# FY 2025-26 / AY 2026-27 tax logic preserved from PayrollReact source.
NEW_REGIME_SLABS=[(400000,0),(800000,.05),(1200000,.10),(1600000,.15),(2000000,.20),(2400000,.25),(float('inf'),.30)]
NEW_REGIME_STANDARD_DEDUCTION=75000; NEW_REGIME_REBATE_LIMIT=1200000; NEW_REGIME_REBATE_MAX=60000
OLD_REGIME_SLABS=[(250000,0),(500000,.05),(1000000,.20),(float('inf'),.30)]
OLD_REGIME_STANDARD_DEDUCTION=50000; OLD_REGIME_REBATE_LIMIT=500000; OLD_REGIME_REBATE_MAX=12500; CESS_RATE=.04

def _slab_tax(x,slabs):
    tax=0; lower=0
    for upper,rate in slabs:
        if x>lower: tax+=(min(x,upper)-lower)*rate; lower=upper
        else: break
    return tax

def calculate_annual_tax(annual_gross_salary,regime='New'):
    regime=(regime or 'New').strip().title()
    if regime=='Old': slabs,sd,limit,rmax=OLD_REGIME_SLABS,OLD_REGIME_STANDARD_DEDUCTION,OLD_REGIME_REBATE_LIMIT,OLD_REGIME_REBATE_MAX
    else: regime='New'; slabs,sd,limit,rmax=NEW_REGIME_SLABS,NEW_REGIME_STANDARD_DEDUCTION,NEW_REGIME_REBATE_LIMIT,NEW_REGIME_REBATE_MAX
    annual=round(annual_gross_salary,2); taxable=round(max(annual-sd,0),2); normal=_slab_tax(taxable,slabs)
    if taxable<=limit: rebate=min(normal,rmax); tax=max(normal-rebate,0)
    else:
        excess=taxable-limit
        if normal>excess: tax=excess; rebate=normal-excess
        else: rebate=0; tax=normal
    cess=round(tax*.04,2); net=round(tax+cess,2)
    return {'regime':regime,'annual_taxable_salary':annual,'standard_deduction':sd,'net_taxable_income':taxable,'tds_at_normal_rate':round(normal,2),'rebate':round(rebate,2),'tax_on_taxable_income':round(tax,2),'education_cess':cess,'net_tax':net}
