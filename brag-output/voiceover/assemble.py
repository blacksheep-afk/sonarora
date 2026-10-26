from pathlib import Path
import json,subprocess
ROOT=Path(__file__).resolve().parent; FILM=ROOT.parent
FF=FILM/'composition/.hyperframes/bin/ffmpeg';FP=FILM/'composition/.hyperframes/bin/ffprobe'
script=json.loads((ROOT/'script.json').read_text())
def probe(path):return json.loads(subprocess.check_output([str(FP),'-v','error','-show_format','-show_streams','-of','json',str(path)]))
def run(args):subprocess.run([str(FF),'-y','-hide_banner','-loglevel','error',*map(str,args)],check=True)
inputs=[];filters=[];report=[]
for i,s in enumerate(script):
 path=ROOT/(s['id']+'.mp3');assert path.is_file(),path
 duration=float(probe(path)['format']['duration']);slot=s['end']-s['start'];speed=max(1,duration/(slot-.08))
 assert speed<=1.22,(s['id'],duration,slot,'Shorten this line instead of rushing it.')
 rendered=ROOT/(s['id']+'-timed.wav')
 run(['-i',path,'-af',f'atempo={speed:.7f},loudnorm=I=-16:TP=-1.5:LRA=9,apad=whole_dur={slot},atrim=duration={slot}', '-ar','48000','-ac','1',rendered])
 inputs+=['-i',rendered]
 delay=round(s['start']*1000);filters.append(f'[{i}:a]adelay={delay}:all=1[s{i}]')
 report.append({'id':s['id'],'sourceDuration':duration,'slot':slot,'start':s['start'],'speed':speed,'text':s['text']})
filters.append(''.join(f'[s{i}]' for i in range(len(script)))+f'amix=inputs={len(script)}:normalize=0,apad=whole_dur=80,atrim=duration=80[voice]')
run([*inputs,'-filter_complex',';'.join(filters),'-map','[voice]','-ar','48000','-ac','1',ROOT/'voiceover.wav'])
run(['-i',ROOT/'voiceover.wav','-c:a','libmp3lame','-b:a','192k',ROOT/'voiceover.mp3'])
# Keep the source video pixels and its thumbnail frame; lower/duck the existing music under speech.
run(['-i',FILM/'brag.mp4','-i',ROOT/'voiceover.wav','-filter_complex','[1:a]asplit=2[voice][control];[0:a]volume=0.6[bed];[bed][control]sidechaincompress=threshold=0.025:ratio=6:attack=15:release=250[ducked];[ducked][voice]amix=inputs=2:normalize=0,alimiter=limit=0.95:level=0,apad=whole_dur=80,atrim=duration=80[mix]','-map','0:v:0','-map','[mix]','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart','-t','80',FILM/'sonarora-narrated.mp4'])
result=probe(FILM/'sonarora-narrated.mp4');assert abs(float(result['format']['duration'])-80)<.05
v=next(x for x in result['streams'] if x['codec_type']=='video');assert v['width']==1920 and v['height']==1080 and int(v['nb_frames'])==2400
volume=subprocess.run([str(FF),'-hide_banner','-i',str(FILM/'sonarora-narrated.mp4'),'-af','volumedetect','-f','null','-'],capture_output=True,text=True,check=True)
verification={'provider':'ElevenLabs','voice':'Queen B','model':'Eleven Multilingual v2','durationSeconds':float(result['format']['duration']),'width':v['width'],'height':v['height'],'frames':int(v['nb_frames']),'originalPictureCopiedWithoutReencoding':True,'sourceMusicLoweredAndDucked':True,'segments':report,'audioLevels':[x for x in volume.stderr.splitlines() if 'mean_volume' in x or 'max_volume' in x]}
(ROOT/'verification.json').write_text(json.dumps(verification,indent=2));print(json.dumps(verification,indent=2))
def ts(x):
 ms=round(x*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
(ROOT/'narration.srt').write_text('\n\n'.join(f"{i+1}\n{ts(s['start'])} --> {ts(s['end'])}\n{s['text']}" for i,s in enumerate(script))+'\n')
