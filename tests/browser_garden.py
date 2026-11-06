"""Real Chromium garden-maze play: adjacent tiles, three earned gates, saved Sparks and phone D-pad."""
import json
import os
import pathlib
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

BASE=os.environ.get('MORI_BROWSER_BASE','http://127.0.0.1:4173/Tamagochi---Open-Source-Game/')
OUT=pathlib.Path('artifacts/garden-trail')
OUT.mkdir(parents=True,exist_ok=True)
routes=[
 [(1,4),(2,4),(3,4),(3,3),(3,2),(3,1),(3,0),(4,0)],
 [(1,4),(2,4),(3,4),(4,4),(4,3),(4,2),(3,2),(2,2),(2,1),(2,0),(3,0),(4,0)],
 [(1,4),(2,4),(3,4),(4,4),(4,3),(4,2),(4,1),(4,0)],
]
options=Options()
for x in ('--headless=new','--no-sandbox','--disable-dev-shm-usage',
          '--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader','--window-size=1280,860'):
 options.add_argument(x)
options.set_capability('goog:loggingPrefs',{'browser':'ALL'})
browser=webdriver.Chrome(options=options)
wait=WebDriverWait(browser,45)
def snapshot():
 return browser.execute_script("""return JSON.parse(localStorage.getItem('pocket-worlds-save-v1'))?.state || {sparks:0,activityBest:{}}""")
def step(x,y):
 # Real UI button event; React validates adjacency/walls/collectibles.
 ok=browser.execute_script("""const el=document.querySelector('[data-garden-x="'+arguments[0]+'"][data-garden-y="'+arguments[1]+'"]');
  if(!el||el.disabled)return false;
  el.click();return true;""",x,y)
 assert ok,{'tile':(x,y),'screen':browser.execute_script("return document.querySelector('.garden-board')?.textContent")}
def pos():
 return browser.execute_script("""const el=document.querySelector('.garden-player');return el?[Number(el.dataset.gardenX),Number(el.dataset.gardenY)]:null""")
try:
 browser.get(BASE)
 wait.until(lambda b:b.find_elements(By.CSS_SELECTOR,'[data-arcade-game="garden-trail"]'))
 for selector in ('.tutorial-skip','.story-dialog .dialog-close'):
  matches=browser.find_elements(By.CSS_SELECTOR,selector)
  if matches:browser.execute_script('arguments[0].click()',matches[0])
 before=snapshot()
 browser.execute_script("""document.querySelector('[data-arcade-game="garden-trail"]').click()""")
 wait.until(lambda b:b.find_elements(By.CSS_SELECTOR,'.garden-board .game-prompt button'))
 assert browser.execute_script("return document.querySelector('#game-title').textContent")=='Garden Trail'
 browser.save_screenshot(str(OUT/'01-garden-intro.png'))
 browser.find_element(By.CSS_SELECTOR,'.garden-board .game-prompt button').click()
 wait.until(lambda b:len(b.find_elements(By.CSS_SELECTOR,'.garden-tile'))==25)
 assert pos()==[0,4],pos()
 # Goal cannot be tapped from afar and does not pay anything.
 assert browser.execute_script("""return document.querySelector('[data-garden-x="4"][data-garden-y="0"]').disabled""")
 assert browser.execute_script("return document.querySelector('.garden-board').textContent.includes('Find two blossoms')")
 step(1,4)
 step(2,4)
 assert pos()==[2,4]
 first=browser.execute_script("return document.querySelector('.game-hud').textContent")
 assert '4' in first,first
 step(1,4)
 step(2,4)
 once=browser.execute_script("return document.querySelector('.game-hud').textContent")
 assert once==first,{'first':first,'afterReturn':once}
 for x,y in routes[0][2:]:step(x,y)
 wait.until(lambda b:b.execute_script("return document.querySelector('.game-hud')?.textContent.includes('2 / 3')"))
 browser.save_screenshot(str(OUT/'02-garden-second-round.png'))
 for x,y in routes[1]:step(x,y)
 wait.until(lambda b:b.execute_script("return document.querySelector('.game-hud')?.textContent.includes('3 / 3')"))
 for x,y in routes[2]:step(x,y)
 wait.until(lambda b:b.find_elements(By.CSS_SELECTOR,'.garden-board .game-prompt'))
 done=browser.find_element(By.CSS_SELECTOR,'.garden-board .game-prompt').text
 assert 'garden points' in done and 'Sparks' in done,done
 saved=snapshot()
 assert saved['activityBest']['garden-trail']>50,saved
 assert saved['sparks']>before['sparks'],{'before':before['sparks'],'after':saved['sparks']}
 browser.save_screenshot(str(OUT/'03-all-gardens-restored.png'))
 browser.find_element(By.CSS_SELECTOR,'.game-dialog header button').click()
 browser.refresh()
 wait.until(lambda b:b.find_elements(By.CSS_SELECTOR,'[data-arcade-game="garden-trail"]'))
 restored=snapshot()
 assert restored['activityBest']['garden-trail']==saved['activityBest']['garden-trail'],restored
 assert restored['sparks']>=saved['sparks'],restored
 browser.set_window_size(390,844)
 browser.execute_script("""document.querySelector('[data-arcade-game="garden-trail"]').click()""")
 browser.find_element(By.CSS_SELECTOR,'.garden-board .game-prompt button').click()
 wait.until(lambda b:len(b.find_elements(By.CSS_SELECTOR,'.garden-tile'))==25)
 browser.find_element(By.CSS_SELECTOR,'.garden-right').click()
 wait.until(lambda b:pos()==[1,4])
 mobile=browser.execute_script("""return (()=>{const grid=document.querySelector('.garden-map').getBoundingClientRect(),modal=document.querySelector('.game-dialog').getBoundingClientRect();return {
  width:innerWidth,gridLeft:grid.left,gridRight:grid.right,dialogLeft:modal.left,dialogRight:modal.right,
  keys:document.querySelectorAll('.garden-dpad button').length,tiles:document.querySelectorAll('.garden-tile').length};})()""")
 assert mobile['keys']==4 and mobile['tiles']==25,mobile
 assert mobile['gridLeft']>=0 and mobile['gridRight']<=mobile['width']+3,mobile
 assert mobile['dialogLeft']>=0 and mobile['dialogRight']<=mobile['width']+3,mobile
 browser.save_screenshot(str(OUT/'04-garden-mobile.png'))
 errors=[x['message'] for x in browser.get_log('browser') if x['level']=='SEVERE' and 'favicon' not in x['message']]
 assert not errors,errors
 report={'status':'PASS','score':saved['activityBest']['garden-trail'],
   'sparks':saved['sparks'],'result':done,'mobile':mobile,'errors':errors}
 (OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 print(json.dumps(report,ensure_ascii=False),flush=True)
finally:
 browser.quit()
