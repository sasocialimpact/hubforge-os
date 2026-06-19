# Honest Assessment: What's Wrong Right Now

## The UI is broken because I kept adding without integrating

1. **Too many buttons**: Programs, Org, Settings, Cmd+K - user doesn't know what does what
2. **Settings scattered**: AI settings in one dialog, Org settings in another - should be ONE
3. **Context blocks invisible**: Built the library but never added UI to see/use them
4. **Org context not wired**: Built the profile form but the data isn't flowing to reasoning
5. **Dashboard incomplete**: Shows programs but not context blocks or templates
6. **Mode toggle removed but GeekMode still renders**: Dead code

## What Claude does right (that we should copy)

- ONE settings panel with everything: Account, AI, Preferences
- Clean sidebar: conversations (our: programs)
- Minimal header: just logo + settings gear
- Everything else via Cmd+K

## What I need to do

1. **ONE unified settings dialog** with tabs: AI | Organization | Preferences
2. **Dashboard** that shows: Programs + Context Blocks + Templates (all in one view)
3. **Clean header**: Logo | Programs toggle | Settings gear | Cmd+K
4. **Remove dead code**: GeekMode still rendered but hidden, org not connected
5. **Actually wire org context**: Make sure getOrgContextBlock() is called and passed
