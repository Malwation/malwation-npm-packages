// 20+ animation & 3D examples. Each is ~6–7s and loops; motion is best seen
// live (still screenshots can't show it). `window.VIZ_ANIMS`.
window.VIZ_ANIMS = [
  {
    title: 'Flow — marching edges',
    note: 'graph … flow : dashes flow along edges to show direction.',
    source: `\`\`\`graph LR flow
a: [ @gear loader ]
b: [ @skull payload ]
c: ( @globe c2 )
a -> b : "unpack"
b -> c : "beacon" [err]
\`\`\``,
  },
  {
    title: 'Draw-in — staggered build',
    note: 'graph … draw : nodes and edges reveal in sequence, then edges flow.',
    source: `\`\`\`graph TD draw
s: [[ Sandbox ]]
s.a: [ explorer.exe ]
s.b: [ malware.exe ]
v: { Malicious? }
s.a -> s.b
s.b -> v
\`\`\``,
  },
  {
    title: 'Pulse — breathing nodes',
    note: 'graph … pulse : nodes breathe (scale + opacity).',
    source: `\`\`\`graph LR pulse
a: [ ingest ]
b: [ analyze ]
c: ( verdict )
a -> b
b -> c
\`\`\``,
  },
  {
    title: 'Beacon — C2 ping rings',
    note: 'graph … beacon : expanding rings pulse out of each node.',
    source: `\`\`\`graph LR beacon
mal: [ @skull implant ]
c2: ( @globe 45.13.7.2 )
mal -> c2 : "beacon" [err]
\`\`\``,
  },
  {
    title: 'Trace — attack path',
    note: 'graph … trace : edges light up in sequence along the chain.',
    source: `\`\`\`graph LR trace
r: ( recon )
w: ( weaponize )
d: ( deliver )
e: ( exploit )
i: ( install )
c2: ( c2 )
r -> w
w -> d
d -> e
e -> i
i -> c2
\`\`\``,
  },
  {
    title: 'Animated isometric',
    note: 'graph … iso draw : the 2.5D projection reveals + flows.',
    source: `\`\`\`graph TD iso draw
s: [[ Sandbox ]]
s.a: [ @gear explorer.exe ]
s.b: [ @skull malware.exe ]
c2: ( @globe C2 )
s.a -> s.b : "spawns"
s.b -> c2 : "beacon" [err]
\`\`\``,
  },
  {
    title: 'Real 3D graph (rotating)',
    note: 'graph3d : true 3D coordinates, rotating ~7s/rev, perspective + depth. Hover to pause.',
    source: `\`\`\`graph3d
root: [ services.exe ]
a: [ svchost.exe ]
b: [ explorer.exe ]
c: [ malware.exe ]
d: [ cmd.exe ]
e: [ powershell.exe ]
root -> a
root -> b
a -> c
b -> c
c -> d
c -> e
\`\`\``,
  },
  {
    title: '3D bars',
    note: 'bars3d : extruded isometric columns.',
    source: `\`\`\`bars3d
behavior: 92
network: 71
stealth: 45
persistence: 88
\`\`\``,
  },
  {
    title: 'Count-up stats',
    note: 'stat tiles count up from zero on render.',
    source: `:::stat
92 | Threat score | +14
1450 | Requests |
37 | Signatures | +5
:::`,
  },
  {
    title: 'Score count-up',
    note: 'big score animates up with its grade.',
    source: `:::score
92 A threat
:::`,
  },
  {
    title: 'Progress fill',
    note: 'inline bars sweep from 0 to value.',
    source: `Analysis [[progress 72]] · unpack [[progress 4/5]] · confidence [[progress 88]]`,
  },
  {
    title: 'Gauge sweep',
    note: 'the arc sweeps 0 → value.',
    source: `:::gauge
78 detection rate
:::`,
  },
  {
    title: 'Spinner',
    note: 'rotating arc — indeterminate work.',
    source: `:::spinner scanning 2,481 files…
:::`,
  },
  {
    title: 'Loader bar',
    note: 'indeterminate sliding bar.',
    source: `:::loader detonating sample in sandbox
:::`,
  },
  {
    title: 'Heartbeat status',
    note: 'pulsing live indicator.',
    source: `:::pulsedot host-7 · live
:::`,
  },
  {
    title: 'Typewriter',
    note: 'types out then blinks the caret, looping.',
    source: `:::typewriter analyzing 45.13.7.2 → RedLine stealer detected
:::`,
  },
  {
    title: 'Radar sweep',
    note: 'conic sweep with blips.',
    source: `:::radar
:::`,
  },
  {
    title: 'Countdown ring',
    note: 'a depleting timer ring (SMIL).',
    source: `:::countdown 7s
sandbox TTL
:::`,
  },
  {
    title: 'Beacon widget',
    note: 'concentric ping rings.',
    source: `:::beacon C2 ping every 45s
:::`,
  },
  {
    title: 'Matrix rain',
    note: 'falling glyph columns.',
    source: `:::matrix
:::`,
  },
  {
    title: 'Kill-chain (flow + labels)',
    note: 'combined: flowing colored edges across a full chain.',
    source: `\`\`\`graph LR flow
a: [ @mail phish ]
b: [ @file macro ]
c: [ @gear loader ]
d: [ @skull stealer ]
e: ( @globe exfil )
a -> b : "open"
b -> c : "drop" [warn]
c -> d : "inject" [err]
d -> e : "POST" [err]
\`\`\``,
  },
];
