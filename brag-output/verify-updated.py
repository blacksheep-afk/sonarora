from pathlib import Path
import subprocess,json,os
r=Path(__file__).resolve().parent;ff=r/'composition/.hyperframes/bin/ffmpeg';fp=r/'composition/.hyperframes/bin/ffprobe';video=r/'sonarora-updated.mp4'
def run(args):subprocess.run([str(ff),'-hide_banner','-loglevel','error','-y',*map(str,args)],check=True)
assert video.stat().st_size>100000
run(['-ss','11','-i',video,'-frames:v','1','-q:v','2',r/'sonarora-updated.jpg'])
run(['-i',video,'-i',r/'sonarora-updated.jpg','-filter_complex',"[0:v][1:v]overlay=0:0:enable='eq(n,0)'[v]",'-map','[v]','-map','0:a?','-c:v','libx264','-crf','18','-preset','medium','-pix_fmt','yuv420p','-c:a','copy','-movflags','+faststart',r/'sonarora-updated.poster.mp4'])
os.replace(r/'sonarora-updated.poster.mp4',video)
meta=json.loads(subprocess.check_output([str(fp),'-v','error','-show_entries','format=duration,size:stream=codec_name,codec_type,width,height,r_frame_rate,nb_frames','-of','json',str(video)]))
v=next(x for x in meta['streams'] if x['codec_type']=='video');assert abs(float(meta['format']['duration'])-80)<.05;assert int(v['nb_frames'])==2400;assert v['width']==1920 and v['height']==1080
run(['-ss','77.8','-i',video,'-frames:v','1','-q:v','2',r/'sonarora-updated-closing.jpg'])
meta['closingCredit']='App Created By BlackSheep';meta['posterBakedIntoFirstFrame']=True
(r/'sonarora-updated-verification.json').write_text(json.dumps(meta,indent=2))
(r/'sonarora-updated-credits.txt').write_text('App Created By BlackSheep\nMusic: Sascha Ende, ende.app (CC BY 4.0). Happy Beats / Business Moves, Vol. 12. https://ende.app/en\nSFX: Kenney (CC0).\n')
print(json.dumps(meta,indent=2))
