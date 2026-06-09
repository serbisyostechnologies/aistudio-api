export const templates = {
  cinematicZoomIn: `
    scale=1400:-1,
    zoompan=
    z='min(zoom+0.0015,1.5)':
    x='iw/2-(iw/zoom/2)':
    y='ih/2-(ih/zoom/2)':
    d=125:
    s=1080x1920:
    fps=30
  `,

  cinematicZoomOut: `
    scale=1600:-1,
    zoompan=
    z='if(lte(zoom,1.0),1.5,max(1.0,zoom-0.0015))':
    x='iw/2-(iw/zoom/2)':
    y='ih/2-(ih/zoom/2)':
    d=125:
    s=1080x1920:
    fps=30
  `,

  panLeftToRight: `
    scale=2400:-1,
    zoompan=
    z='1':
    x='min(on*4,iw-iw/2)':
    y='0':
    d=125:
    s=1080x1920:
    fps=30
  `,

  panRightToLeft: `
    scale=2400:-1,
    zoompan=
    z='1':
    x='max(iw-iw/2-on*4,0)':
    y='0':
    d=125:
    s=1080x1920:
    fps=30
  `,

  verticalMove: `
    scale=1080:2400,
    zoompan=
    z='1':
    x='0':
    y='max(0,on*3)':
    d=125:
    s=1080x1920:
    fps=30
  `,

  floating: `
    scale=1200:-1,
    zoompan=
    z='1.1+0.02*sin(on/15)':
    x='iw/2-(iw/zoom/2)':
    y='ih/2-(ih/zoom/2)+10*sin(on/20)':
    d=125:
    s=1080x1920:
    fps=30
  `,

  dramatic: `
    scale=1400:-1,
    rotate='0.01*sin(2*PI*t/3)',
    zoompan=
    z='min(zoom+0.002,1.4)':
    d=125:
    s=1080x1920:
    fps=30
  `,

  parallax: `
    scale=1600:-1,
    zoompan=
    z='1.2':
    x='sin(on/30)*80':
    y='cos(on/25)*40':
    d=125:
    s=1080x1920:
    fps=30
  `,

  slowZoom: `
    scale=1300:-1,
    zoompan=
    z='min(zoom+0.0008,1.2)':
    x='iw/2-(iw/zoom/2)':
    y='ih/2-(ih/zoom/2)':
    d=150:
    s=1080x1920:
    fps=30
  `,

  fastZoom: `
    scale=1500:-1,
    zoompan=
    z='min(zoom+0.003,1.8)':
    x='iw/2-(iw/zoom/2)':
    y='ih/2-(ih/zoom/2)':
    d=100:
    s=1080x1920:
    fps=30
  `,

  blurZoom: `
    split[bg][fg];

    [bg]
    scale=1080:1920,
    boxblur=20[blur];

    [fg]
    scale=1200:-1,
    zoompan=
    z='min(zoom+0.0015,1.4)':
    d=125:
    s=1080x1920[front];

    [blur][front]
    overlay=(W-w)/2:(H-h)/2
  `,

  shake: `
    scale=1400:-1,
    zoompan=
    z='1.2':
    x='sin(on*2)*10':
    y='cos(on*2)*10':
    d=125:
    s=1080x1920:
    fps=30
  `,

  cinematicDrift: `
    scale=1600:-1,
    zoompan=
    z='1.15':
    x='sin(on/40)*120':
    y='cos(on/35)*50':
    d=125:
    s=1080x1920:
    fps=30
  `,
};