from pathlib import Path
import json,html
P=Path(__file__).resolve().parent/'composition';(P/'compositions').mkdir(exist_ok=True)
A=json.loads((P/'assets/music/audio-data.json').read_text())
base='''
@font-face{font-family:Manrope;src:url('assets/fonts/manrope.woff2')}@font-face{font-family:SourceSans;src:url('assets/fonts/source-sans-3.woff2')}
*{box-sizing:border-box}#root{position:absolute;inset:0;color:var(--color-ink,#102d3b);font-family:SourceSans;background:var(--color-ground,#f4f8f8);overflow:hidden}
.stage{position:absolute;inset:0;background:var(--color-ground,#f4f8f8)}
h1,h2,h3,p{margin:0}h1,h2,h3,.brand{font-family:Manrope;font-weight:750;letter-spacing:-.04em}h1{font-size:80px;line-height:1.12}h2{font-size:64px;line-height:1.16}p{font-size:36px;line-height:1.35}strong{font-weight:700}.accent{color:var(--color-accent,#007d87)}
.eyebrow{position:absolute;left:192px;top:88px;font-size:30px;font-weight:650;letter-spacing:.09em;color:#125461}.title{position:absolute;left:192px;top:155px;width:1536px;font-size:64px;line-height:1.16}.footer{position:absolute;left:192px;bottom:66px;width:1536px;font-size:30px;line-height:1.25;color:#506471}
.panel{position:absolute;border:2px solid #d4e0e5;border-radius:20px;background:white;overflow:hidden;box-shadow:0 18px 40px #102d3b14}
.shot{position:absolute;width:100%;height:100%;inset:0;object-fit:contain;background:white}.shot-stack{position:absolute}.word{display:inline-block}.hairline{position:absolute;left:192px;top:139px;width:1536px;height:2px;background:#d4e0e5}.cursor{position:absolute;width:28px;height:36px;background:#102d3b;clip-path:polygon(0 0,0 100%,28% 73%,52% 100%,68% 90%,44% 63%,85% 57%);z-index:8}.pill{display:inline-block;padding:10px 20px;border-radius:30px;background:#e8f3f4;color:#125461;font-size:30px;font-weight:650}
'''
def image(id,src,style=''):
 return f'<img id="{id}" class="shot" src="assets/screens/{src}.png" alt="Sonarora {src.replace("-"," ")}" style="{style}">'
def text(id,tag,copy,style='',cls=''):
 return f'<{tag} id="{id}" class="{cls}" style="{style}">{copy}</{tag}>'
def shell(id,number,heading):
 return text(id+'-eyebrow','p',f'SONARORA / {number:02d}',cls='eyebrow')+'<div class="hairline"></div>'+text(id+'-title','h2',heading,cls='title')
scenes=[]
def scene(id,duration,markup,js,extra=''):
 scenes.append((id,duration))
 (P/'compositions'/f'{id}.html').write_text(f'''<template><style>{base}{extra}</style><div id="root" data-composition-id="{id}" data-width="1920" data-height="1080"><div class="stage">{markup}</div></div><script>const tl=gsap.timeline({{paused:true}});{js}\nwindow.__timelines["{id}"]=tl;</script></template>''')
def enter(selector,start=0,kind='up',duration=.65):
 props={'opacity':0}
 if kind=='up':props['y']=32
 if kind=='right':props['x']=60
 if kind=='left':props['x']=-50
 if kind=='scale':props['scale']=.96
 end={'opacity':1,'x':0,'y':0,'scale':1,'duration':duration,'ease':'power4.out'}
 return f'tl.fromTo("{selector}",{json.dumps(props)},{json.dumps(end)},{start});'
def fade(selector,start,duration=.22):return f'tl.to("{selector}",{{opacity:0,duration:{duration},ease:"power2.in"}},{start});'
# 1: the trade-off, not a promise.
id='choice'
m=text(id+'-eyebrow','p','FOR SMALL TRADERS. FOR IRREGULAR INCOME.',cls='eyebrow')+text(id+'-title','h1','Stock today.<br><span class="accent">Bills tomorrow.</span>','position:absolute;left:192px;top:260px;width:800px;font-size:104px')
m+=text(id+'-question','p','What changes if the payment arrives late?','position:absolute;left:192px;top:590px;width:760px;font-size:42px')
for i,(amount,label) in enumerate([('R600','Cash you have'),('R500','Bill you must pay'),('R250','Cost of stock')]):
 m+=f'<div id="choice-money-{i}" class="panel" style="left:1090px;top:{235+i*180}px;width:635px;height:152px;padding:24px 34px;display:flex;align-items:center;justify-content:space-between"><h2 style="font-size:66px">{amount}</h2><p style="width:270px;font-size:34px">{label}</p></div>'
m+=text('choice-note','p','Invented example. No bank account is connected.',cls='footer')
scene(id,7,m,enter('#choice-title',0,'left')+enter('#choice-question',1)+''.join(enter('#choice-money-'+str(i),.55+i*.72,'right') for i in range(3))+enter('#choice-note',2.8)+fade('#choice-question',6.5))
# 2: brand plus genuine overview.
id='reveal';m=text('reveal-eyebrow','p','MEET SONARORA',cls='eyebrow')+text('reveal-title','h1','See the trade-offs<br>before you<br>buy stock.','position:absolute;left:192px;top:265px;width:570px;font-size:62px')
m+=f'<div id="reveal-product" class="panel" style="left:800px;top:220px;width:960px;height:650px">{image("reveal-image","home-example")}</div>'
m+=text('reveal-note','p','Your money → Compare options → Check a purchase',cls='footer')
scene(id,7,m,enter('#reveal-title',0,'left')+enter('#reveal-product',.35,'scale',.9)+enter('#reveal-note',1.2)+f'tl.fromTo("#reveal-product",{{borderColor:"#d4e0e5"}},{{borderColor:"#007d87",duration:.7,ease:"power2.inOut"}},1.74); // beat-locked: global 8.74s\n')
# 3: staged real inputs.
id='money';m=shell(id,1,'Start with the money you have.')
m+=f'<div id="money-panel" class="panel" style="left:192px;top:270px;width:740px;height:700px">{image("money-empty","form-empty")}{image("money-partial","form-partial")}{image("money-complete","form-example")}</div>'
m+=text('money-line1','h2','Add the payment<br>you expect.','position:absolute;left:1050px;top:350px;width:680px;font-size:64px')
m+=text('money-line2','p','Choose how likely it is to arrive.','position:absolute;left:1050px;top:575px;width:620px;font-size:42px')
m+=text('money-line3','p','Payment day and bill due day<br>use days 1–14.','position:absolute;left:1050px;top:760px;width:650px;font-size:34px;color:#506471')
m+='<div id="money-cursor" class="cursor" style="left:840px;top:350px"></div>'
js=enter('#money-title',0)+enter('#money-panel',.15,'left')+enter('#money-line1',.9)+enter('#money-line2',3.47)+enter('#money-line3',5.3)
js+='tl.set("#money-partial,#money-complete",{opacity:0},0);tl.to("#money-partial",{opacity:1,duration:.18},3.47);tl.to("#money-complete",{opacity:1,duration:.18},6.56); // beat-grid: global 17.47s, 20.56s; readable holds preserved\n'
js+=enter('#money-cursor',.8,'scale',.25)+'tl.to("#money-cursor",{y:250,x:-60,duration:1.1,ease:"power2.inOut"},3.0);tl.to("#money-cursor",{y:370,x:-35,duration:.75,ease:"power2.inOut"},5.1);'+fade('#money-cursor',7.8)
scene(id,11,m,js)
# 4: actual risk, not a made-up safety score.
id='result';m=shell(id,2,'See the chance of missing a bill.')
m+=text('result-number','h1','6.25<span style="font-size:80px">%</span>','position:absolute;left:192px;top:330px;font-size:180px;color:#c73338')
m+=text('result-context','p','Buy now · invented example','position:absolute;left:192px;top:555px;width:700px;font-size:38px')
m+=text('result-warning','p','0% in the model<br>is not a guarantee.','position:absolute;left:192px;top:720px;width:720px;font-size:42px')
m+=f'<div id="result-product" class="panel" style="left:1010px;top:270px;width:720px;height:700px">{image("result-image","result")}</div>'
scene(id,10,m,enter('#result-title',0)+enter('#result-number',.25,'scale')+enter('#result-product',.5,'right')+enter('#result-context',1.1)+enter('#result-warning',4.0))
# 5: show the real cards, acknowledge the tie.
id='compare';m=shell(id,3,'Three timings. One clearer comparison.')
m+=f'<div id="compare-product" class="panel" style="left:128px;top:330px;width:1664px;height:445px">{image("compare-image","cards")}</div>'
m+=text('compare-tie','p','Two options tie in this example.','position:absolute;left:192px;top:830px;font-size:42px')
m+=text('compare-note','p','Calculated examples, not financial advice.',cls='footer')
scene(id,11,m,enter('#compare-title',0,'left')+enter('#compare-product',.4,'scale',.8)+enter('#compare-tie',3.2)+enter('#compare-note',4.2))
# 6: real possible paths, one unfavourable outcome included.
id='map';m=shell(id,4,'Follow one possible path.')
m+=f'<div id="map-product" class="panel" style="left:128px;top:270px;width:1664px;height:680px">{image("map-first","money-map")}{image("map-second","money-path")}</div>'
m+=text('map-caption','p','A missed bill stays unpaid in this model.',cls='footer')
scene(id,11,m,enter('#map-title',0)+enter('#map-product',.25,'right')+'tl.set("#map-second",{opacity:0},0);tl.to("#map-first",{opacity:0,duration:.2},4);tl.to("#map-second",{opacity:1,duration:.2},4.1);'+enter('#map-caption',5.5))
# 7: smaller purchases, current popup.
id='purchase';m=shell(id,5,'What if you buy in smaller batches?')
m+=f'<div id="purchase-page" class="panel" style="left:180px;top:280px;width:1560px;height:640px">{image("purchase-page-image","purchase-page")}</div>'
m+=text('purchase-explain','h2','Check a smaller<br>first purchase.','position:absolute;left:192px;top:350px;width:750px;font-size:70px')
m+=text('purchase-terms','p','Supplier rules.<br>Delivery costs.<br>Bills still to pay.','position:absolute;left:192px;top:600px;width:700px;font-size:42px;line-height:1.5')
m+=f'<div id="purchase-popup" class="panel" style="left:1060px;top:245px;width:660px;height:725px">{image("purchase-popup-image","purchase-modal")}{image("purchase-assessment","purchase-modal")}</div>'
js=enter('#purchase-title',0)+enter('#purchase-page',.2,'scale')+fade('#purchase-page',2.1)+enter('#purchase-explain',2.3,'left')+enter('#purchase-terms',3.1)+enter('#purchase-popup',2.3,'right')+'tl.set("#purchase-assessment",{opacity:0},0);tl.to("#purchase-assessment",{opacity:1,duration:.25},7.0);'
scene(id,11,m,js)
# 8: gentle errors and truthful boundaries.
id='trust';m=shell(id,6,'Your numbers. Your decision.')
m+=f'<div id="trust-product" class="panel" style="left:192px;top:270px;width:670px;height:700px">{image("trust-image","friendly-error")}</div>'
for i,line in enumerate(['No bank connection.','No payments.','Nothing is saved.']):m+=text('trust-line-'+str(i),'h2',line,f'position:absolute;left:1020px;top:{350+i*150}px;width:730px;font-size:54px')
scene(id,7,m,enter('#trust-title',0)+enter('#trust-product',.2,'left')+''.join(enter('#trust-line-'+str(i),1+i*.9,'right') for i in range(3)))
# 9: still end card, sufficient readable hold and attribution.
id='outro';m=text('outro-brand','h1','Sonarora','position:absolute;left:192px;top:245px;width:1536px;text-align:center;font-size:150px;color:#ffffff',cls='brand')
m+=text('outro-tagline','p','See the trade-offs before you buy stock.','position:absolute;left:192px;top:485px;width:1536px;text-align:center;font-size:54px;color:#ffffff')
m+=text('outro-boundary','p','Independent prototype. Not financial advice.','position:absolute;left:192px;top:670px;width:1536px;text-align:center;font-size:34px;color:#ffffff')
m+=text('outro-credit','p','Music: Sascha Ende, ende.app (CC BY 4.0)','position:absolute;left:192px;top:890px;width:1536px;text-align:center;font-size:28px;color:#ffffff')
scene(id,5,m,enter('#outro-brand',0,'scale',.55)+enter('#outro-tagline',.4)+enter('#outro-boundary',.75)+enter('#outro-credit',1),'#root,.stage{background:#102d3b}')
# Root: editable scene hosts and audio only.
variables=[{'id':'color-ground','type':'color','label':'Background','default':'#f4f8f8'},{'id':'color-ink','type':'color','label':'Text','default':'#102d3b'},{'id':'color-accent','type':'color','label':'Teal','default':'#007d87'}]
root=['<!doctype html><html lang="en" data-composition-variables=\''+json.dumps(variables)+'\'><head><meta charset="UTF-8"><meta name="viewport" content="width=1920,height=1080"><script src="assets/runtime/gsap.min.js"></script><style>html,body{margin:0;width:1920px;height:1080px;overflow:hidden;background:#f4f8f8}*{box-sizing:border-box}#root{position:absolute;inset:0}.clip{position:absolute;inset:0}</style></head><body><div id="root" data-composition-id="main" data-start="0" data-duration="80" data-width="1920" data-height="1080" data-fps="30">']
start=0
for id,d in scenes:
 root.append(f'<div id="{id}" class="clip" data-composition-id="{id}" data-composition-src="compositions/{id}.html" data-start="{start}" data-duration="{d}" data-track-index="1" data-track-kind="graphics" data-width="1920" data-height="1080"></div>');start+=d
assert start==80
root.append('<audio id="music-bed" class="clip" src="assets/music/sonarora-bed.mp3" data-start="0" data-duration="80" data-track-index="10" data-volume="0.28" data-fade-in="1" data-fade-out="3"></audio>')
for i,(at,file,gain) in enumerate([(0.5,'impactSoft_medium_001.ogg',.3),(8.74,'impactSoft_medium_001.ogg',.25),(17.47,'click_003.ogg',.5),(20.56,'click_003.ogg',.5),(50.1,'click_003.ogg',.45),(59.3,'click_003.ogg',.45),(75.3,'impactSoft_medium_001.ogg',.3)]):
 root.append(f'<audio id="sfx-{i}" class="clip" src="assets/sfx/{file}" data-start="{at}" data-duration="{0.01 if file.startswith("click") else 0.18}" data-track-index="{11+i}" data-volume="{gain}"></audio>')
root.append('</div><script>window.__timelines=window.__timelines||{};window.__timelines.main=gsap.timeline({paused:true});</script></body></html>')
(P/'index.html').write_text('\n'.join(root))
# Subtle audio-informed border presence on the product reveal, no continuous pulse.
peak=max(x['rms'] for x in A['frames'][7*30:14*30]);p=P/'compositions/reveal.html';s=p.read_text().replace('window.__timelines["reveal"] = tl;',f'tl.fromTo("#reveal-product",{{boxShadow:"0 18px 40px #102d3b14"}},{{boxShadow:"0 18px {40+round(peak*12)}px #102d3b20",duration:.7}},1.74);\nwindow.__timelines["reveal"] = tl;');p.write_text(s)
(P/'meta.json').write_text(json.dumps({'id':'sonarora-product-film','name':'Sonarora — Before you buy stock','duration':80},indent=2))
print('Built',len(scenes),'scenes,',start,'seconds')
