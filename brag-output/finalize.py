from pathlib import Path
import subprocess,json,os
ROOT=Path(__file__).resolve().parent
FF=ROOT/'composition/.hyperframes/bin/ffmpeg';FP=ROOT/'composition/.hyperframes/bin/ffprobe'
def run(args):subprocess.run([str(FF),'-hide_banner','-loglevel','error','-y',*args],check=True)
video=ROOT/'brag.mp4'
assert video.stat().st_size>100000
# Pick the settled brand/product reveal, then bake it as frame 0 for reliable thumbnails.
run(['-ss','11','-i',str(video),'-frames:v','1','-q:v','2',str(ROOT/'brag.jpg')])
run(['-i',str(video),'-i',str(ROOT/'brag.jpg'),'-filter_complex',"[0:v][1:v]overlay=0:0:enable='eq(n,0)'[v]",'-map','[v]','-map','0:a?','-c:v','libx264','-crf','18','-preset','medium','-pix_fmt','yuv420p','-c:a','copy','-movflags','+faststart',str(ROOT/'brag.poster.mp4')])
os.replace(ROOT/'brag.poster.mp4',video)
metadata=json.loads(subprocess.check_output([str(FP),'-v','error','-show_entries','format=duration,size:stream=codec_name,codec_type,width,height,r_frame_rate,nb_frames','-of','json',str(video)]))
v=next(x for x in metadata['streams'] if x['codec_type']=='video')
a=next(x for x in metadata['streams'] if x['codec_type']=='audio')
assert abs(float(metadata['format']['duration'])-80)<.05,metadata
assert v['width']==1920 and v['height']==1080 and v['r_frame_rate']=='30/1',metadata
assert int(v['nb_frames'])==2400,metadata
for at in [0,11,20,30,40,52,65,72,78]:
 run(['-ss',str(at),'-i',str(video),'-frames:v','1',str(ROOT/'frames'/f'decoded-{at}.jpg')])
volume=subprocess.run([str(FF),'-hide_banner','-i',str(video),'-af','volumedetect','-f','null','-'],text=True,capture_output=True,check=True)
levels=[line.strip() for line in volume.stderr.splitlines() if 'mean_volume' in line or 'max_volume' in line]
check=json.loads((ROOT/'check.json').read_text())
report={'durationSeconds':float(metadata['format']['duration']),'width':v['width'],'height':v['height'],'fps':30,'frames':int(v['nb_frames']),'bytes':int(metadata['format']['size']),'videoCodec':v['codec_name'],'audioCodec':a['codec_name'],'audioLevels':levels,'posterSourceSeconds':11,'posterBakedIntoFrameZero':True,'hyperframesCheckPassed':check['ok'],'contrastChecks':check['contrast']['checked'],'contrastPassed':check['contrast']['passed'],'notes':['Eight craft warnings are intentional 3–6 second reading holds for this 80-second caption-led film.','No narration requested or generated.','All UI captures use the app’s invented example.','No upload or publication performed.']}
(ROOT/'verification.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
