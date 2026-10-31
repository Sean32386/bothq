# tasteful hourglass shaping (Sean's request): fuller bust, defined waist, rounder hips. Body: z up, front = -Y.
import math
def shape(body):
  vs=body.data.vertices;zs=[v.co.z for v in vs];z0=min(zs);H=max(zs)-z0
  ys=[v.co.y for v in vs if .6<(v.co.z-z0)/H<.66 and abs(v.co.x)<.1*H];cy=(min(ys)+max(ys))/2
  for v in vs:
    x,y,z=v.co;f=(z-z0)/H;ax=abs(x)
    # bust: forward + slight lift, two lobes
    g=math.exp(-((f-.735)/.032)**2)*math.exp(-((ax-.052*H)/.035/H)**2)
    if y<cy: v.co.y-=.016*g*min(1,(cy-y)/(.06*H));v.co.z+=.004*g
    # waist
    if ax<.115*H:
      s=1-.065*math.exp(-((f-.625)/.04)**2);v.co.x*=s;v.co.y=cy+(v.co.y-cy)*(1-.03*math.exp(-((f-.625)/.04)**2))
    # hips
    if ax<.17*H and .42<f<.6:
      s=1+.055*math.exp(-((f-.515)/.04)**2);v.co.x*=s;v.co.y=cy+(v.co.y-cy)*(1+.03*math.exp(-((f-.5)/.04)**2))
  print('FIGURE shaped')
