"""Sprint 4 built-app accessibility/resilience checks; invented data only."""
import json
import os

def run_hardening(page, check, output, root):
    origin = page.url.split('#')[0]
    scans = []
    axe_path = root / 'node_modules' / 'axe-core' / 'axe.min.js'
    if not axe_path.is_file():
        raise RuntimeError('Approved axe-core 4.14.0 is missing; run npm ci')
    def audit(name):
        if not page.evaluate("typeof axe !== 'undefined'"):
            page.add_script_tag(path=str(axe_path))
        if os.environ.get('SONARORAAAH_A11Y_NEGATIVE') == '1':
            page.locator('main').evaluate("""n => {
                const input=document.createElement('input');
                input.id='axe-negative-control'; n.append(input);
            }""")
        result = page.evaluate("""async () => {
            const r=await axe.run(document,{runOnly:{type:'tag',values:[
                'wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice'
            ]}});
            return {version:axe.version,violations:r.violations,
                incomplete:r.incomplete,passes:r.passes.map(p=>p.id)};
        }""")
        (output / ('axe-' + name + '.json')).write_text(json.dumps(result,indent=2),encoding='utf-8')
        scans.append({'name':name,'version':result['version'],
            'violations':len(result['violations']),
            'incomplete':[r['id'] for r in result['incomplete']]})
        if result['violations']:
            raise AssertionError('Accessibility violations in '+name+': '+json.dumps([
                {'id':v['id'],'targets':[n['target'] for n in v['nodes']]}
                for v in result['violations']]))
        check(True, 'axe '+name+': zero violations in configured rules')
    def close_more_details():
        dialog=page.get_by_role('dialog',name='More details',exact=True)
        if dialog.is_visible():
            dialog.get_by_role('button',name='Done',exact=True).click()
    def go_inputs():
        close_more_details()
        if not page.locator('#inputs').is_visible():
            page.get_by_role('link',name='Your money',exact=True).click()
    def go_staged():
        close_more_details()
        if not page.locator('#safe-to-buy').is_visible():
            page.get_by_role('link',name='Check a purchase',exact=True).click()
        if not page.locator('.staged-checkpoint').is_visible():
            page.get_by_role('button',name='I understand and want to continue',exact=True).click()
    def open_details():
        page.locator('details').evaluate_all('(nodes)=>nodes.forEach(n=>n.open=true)')
    def example():
        go_inputs()
        page.get_by_role('button',name='Use example',exact=True).first.click()
        page.locator('.result-highlight').wait_for()
        open_details()
    def fill(values):
        extra={'bill2','receiptTiming','billPriority','grossSales','salesLagDays','salesProbability','relation','emergencyAmount','emergencyDay'}
        main={'cash','bank','receivable','receiptDay','bill1','dueDay','stockCost','receiptProbability'}
        for key,value in values.items():
            if key in extra:
                if not page.get_by_role('dialog',name='More details',exact=True).is_visible():
                    go_inputs()
                    page.get_by_role('button',name='More details',exact=True).click()
            elif key in main:
                go_inputs()
            else:
                go_staged()
                open_details()
            node=page.locator('#'+key)
            if node.evaluate('n=>n.tagName')=='SELECT':
                node.select_option(value)
            else:
                node.fill(value)
        close_more_details()
    def compare():
        go_inputs()
        page.locator('#inputs').get_by_role('button',name='Compare options',exact=True).click()
        page.locator('[data-strategy=trigger]').wait_for()
        open_details()
    def confirm():
        go_staged()
        open_details()
        for kind in ['receipt','balance','liabilities']:
            page.get_by_role('checkbox',name={'receipt':'I confirm the payment I entered. Sonarora has not checked it.','balance':'I confirm the balance I entered. Sonarora has not checked it.','liabilities':'I confirm the bills paid and money still owed. Sonarora has not checked this.'}[kind],exact=True).check()
    def staged():
        go_staged()
        open_details()
        page.get_by_role('button',name='Check smaller purchases',exact=True).click()
        page.get_by_role('heading',name='First purchase: fits these numbers',exact=True).wait_for()
    def no_overflow():
        return page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    page.goto(origin)
    page.set_viewport_size({'width':1280,'height':900})
    audit('empty-desktop')
    headings=page.locator('h1,h2,h3,h4,h5,h6').evaluate_all('(nodes)=>nodes.filter(n=>n.getClientRects().length).map(n=>Number(n.tagName[1]))')
    check(headings[0]==1 and all(b<=a+1 for a,b in zip(headings,headings[1:])),
          'Heading order has one starting H1 and no skipped levels')
    page.keyboard.press('Tab')
    check(page.evaluate("getComputedStyle(document.activeElement).outlineStyle==='solid' && parseFloat(getComputedStyle(document.activeElement).outlineWidth)>=3"),
          'Keyboard focus has a visible 3px outline')
    check(page.locator('nav a,button,summary,input:not([type=checkbox]),select,label.check').evaluate_all(
        """nodes=>nodes.filter(n=>n.getClientRects().length && !n.disabled)
        .every(n=>n.getBoundingClientRect().height>=44)"""),
        'Visible native controls and full checkbox labels have 44px height targets')
    page.locator('#inputs').get_by_role('button',name='Compare options',exact=True).click()
    page.locator('#cash[aria-invalid=true]').wait_for()
    fill({'salesProbability':'wrong'})
    page.locator('#inputs').get_by_role('button',name='Compare options',exact=True).click()
    page.get_by_role('button',name='More details',exact=True).click()
    page.locator('#salesProbability-error').wait_for()
    close_more_details()
    page.locator('.error-list summary').click()
    page.locator('.error-summary a[href="#salesProbability"]').click()
    check(page.evaluate("document.activeElement.id==='salesProbability'") and
          page.locator('#salesProbability').is_visible(),
          'Error summary link opens disclosure and restores field focus')
    close_more_details()
    page.set_viewport_size({'width':390,'height':844})
    page.locator('#cash-error').evaluate("n=>n.textContent='Long validation description '+('VeryLongFinancialExplanation'.repeat(80))")
    check(no_overflow(),'Very long unbroken validation descriptions reflow at 390px')
    audit('invalid-mobile-long-copy')
    page.reload()
    check(page.locator('#cash').input_value()=='' and page.locator('[data-strategy]').count()==0,
          'Reload after malformed inputs begins without results or financial entries')
    page.set_viewport_size({'width':1280,'height':900})
    example()
    page.locator('#inputs').get_by_role('button',name='Compare options',exact=True).focus()
    page.keyboard.press('Enter')
    page.locator('[data-strategy=trigger]').wait_for()
    check(page.locator('[data-strategy]').count()==3,'Keyboard Enter submits and displays three comparisons')
    check('bill could still be unpaid' in page.locator('[data-strategy=wait]').inner_text(),
          'Wait-strategy unpaid-bill warning is visible on its card')
    check(page.get_by_text('Amounts are estimates.',exact=False).first.is_visible(),
          'Plain-language rounding warning is visible alongside comparisons')
    audit('comparison-desktop')
    (output/'reading-order.txt').write_text(page.locator('main').aria_snapshot(),encoding='utf-8')
    open_details()
    check('R51 rounding limitation:' in page.locator('.rounding-details').inner_text(),'Full half-cent explanation remains available')
    count=page.locator('#map-path option').count()
    page.locator('#map-path').select_option(str(count-1))
    fill({'receiptProbability':'1','salesProbability':'1'})
    compare()
    check(page.locator('#map-path option').count()==1 and page.locator('#map-path').input_value()=='0',
          'Money Map selection stays aligned when outcome count shrinks')
    go_inputs()
    for i in range(20):
        page.locator('#cash').fill(str(601+i))
        if page.locator('[data-strategy]').count()!=0:
            raise AssertionError('A comparison survived rapid edit '+str(i))
    check(True,'Twenty rapid financial edits leave no stale comparison')
    page.evaluate("""async () => {
        const form=document.querySelector('form');
        for(let i=0;i<8;i++) form.requestSubmit();
        await new Promise(resolve=>setTimeout(resolve,100));
    }""")
    page.locator('[data-strategy=trigger]').wait_for()
    check(page.locator('[data-strategy]').count()==3,'Repeated Compare requests publish only current-session results')
    fill({k:'10000000' for k in ['cash','bank','receivable','bill1','bill2',
        'stockCost','grossSales','emergencyAmount']})
    compare()
    check(page.locator('[aria-invalid=true]').count()==0,'Maximum permitted R10 million money inputs remain supported')
    fill({'cash':'10000000.01'})
    page.locator('#inputs').get_by_role('button',name='Compare options',exact=True).click()
    page.locator('#cash[aria-invalid=true]').wait_for()
    check('10,000,000' in page.locator('#cash-error').inner_text(),
          'One cent over permitted input limit is rejected')
    example()
    fill({'cash':'0','receivable':'0','bill1':'0','bill2':'0','stockCost':'0',
          'grossSales':'0','emergencyAmount':'100','emergencyDay':'1',
          'receiptProbability':'0','salesProbability':'0'})
    compare()
    card=page.locator('[data-strategy=now]')
    check(card.locator('dd').first.inner_text()=='0%' and 'R100.00' in card.inner_text() and 'R-100.00' in card.inner_text(),
          'Emergency-only debt shows zero essential risk but unpaid expense and negative net')
    example()
    confirm()
    for _ in range(3):
        staged()
        page.get_by_role('heading',name='Next purchase: fits these numbers',exact=True).wait_for()
    check(True,'Repeated staged checks retain only a current feasible assessment')
    page.set_viewport_size({'width':390,'height':844})
    fill({'clearedBalance':'349.99'})
    check(page.get_by_role('checkbox',checked=True).count()==0 and
          'Next purchase:' not in page.get_by_test_id('safe-result').inner_text(),
          'Receipt/balance edit synchronously clears staged assessment and confirmations')
    staged()
    page.get_by_role('heading',name='Next purchase: wait',exact=True).wait_for()
    audit('locked-mobile')
    fill({'clearedBalance':'350'})
    confirm()
    staged()
    page.get_by_role('heading',name='Next purchase: fits these numbers',exact=True).wait_for()
    page.set_viewport_size({'width':1280,'height':900})
    audit('feasible-desktop')
    page.screenshot(path=str(output/'hardened-desktop.png'),full_page=True)
    page.set_viewport_size({'width':390,'height':844})
    page.screenshot(path=str(output/'hardened-mobile.png'),full_page=False)
    page.emulate_media(reduced_motion='reduce')
    check(page.locator('button').first.evaluate("n=>getComputedStyle(n).animationName==='none' && getComputedStyle(n).transitionDuration==='0s'"),
          'Reduced-motion mode has no animation or transition')
    page.add_style_tag(content=':root { font-size: 200% !important; }')
    for width in [1280,390,320]:
        page.set_viewport_size({'width':width,'height':900})
        check(no_overflow(),'200% text enlargement reflows at '+str(width)+'px')
    audit('enlarged-text-320')
    page.goto(origin)
    page.set_viewport_size({'width':1280,'height':900})
    example()
    compare()
    page.get_by_role('link',name='Compare options',exact=True).click()
    fill({'cash':'123'})
    page.get_by_role('link',name='Check a purchase',exact=True).click()
    page.go_back()
    check(page.locator('[data-strategy]').count()==0 and page.locator('#cash').input_value()=='123',
          'Back navigation cannot restore a comparison from before an edit')
    page.go_forward()
    check(page.locator('[data-strategy]').count()==0,'Forward navigation keeps edited results invalid')
    page.reload()
    check(page.locator('#cash').input_value()=='' and page.locator('[data-strategy]').count()==0
          and page.get_by_role('checkbox',checked=True).count()==0,
          'Browser refresh discards prior financial session and confirmations')
    check(page.evaluate('localStorage.length===0 && sessionStorage.length===0') and not page.context.cookies(),
          'Application leaves local/session storage and cookies empty')
    def luminance(hex_value):
        if len(hex_value)==4:
            hex_value='#'+''.join(character*2 for character in hex_value[1:])
        channels=[int(hex_value[i:i+2],16)/255 for i in [1,3,5]]
        linear=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in channels]
        return sum(a*b for a,b in zip(linear,[.2126,.7152,.0722]))
    # Inspect the shipped semantic palette rather than asserting historical constants.
    tokens=page.evaluate("""() => {
        const style=getComputedStyle(document.documentElement);
        return Object.fromEntries(['foreground','background','primary','primary-foreground',
            'muted-foreground','surface','risk-high','risk-high-surface',
            'risk-medium','risk-medium-surface','risk-low','risk-low-surface'].map(
                name=>[name,style.getPropertyValue('--'+name).trim()]));
    }""")
    pairs=[('foreground','background'),('primary-foreground','primary'),
           ('muted-foreground','surface'),('risk-high','risk-high-surface'),
           ('risk-medium','risk-medium-surface'),('risk-low','risk-low-surface')]
    contrast={}
    for foreground,background in pairs:
        values=sorted([luminance(tokens[foreground]),luminance(tokens[background])])
        contrast[foreground+'/'+background]=round((values[1]+.05)/(values[0]+.05),2)
    check(all(value>=4.5 for value in contrast.values()),
          'Rendered semantic text, primary button and risk palettes exceed 4.5:1 contrast')
    return {'scans':scans,'contrast':contrast,'zoomScope':'200% CSS text; 320 CSS px reflow proxy, not OS/browser chrome zoom certification'}
