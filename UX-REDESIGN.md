# HubForge OS - User Experience Redesign (Jobsian)

## The user: Priya, a program officer at REAP NGO in Andhra Pradesh

Priya has 15 minutes between meetings. She needs to draft a literacy program 
proposal for 1,000 children in 20 government schools. The donor deadline is Friday.

### What Priya's experience should be (working backwards from the outcome)

```
Priya opens HubForge.
She sees her dashboard with 3 existing programs.
She clicks "New Program."
She types: "Foundation literacy for 1000 children in 20 AP govt schools"
She picks: Strategy + Theory of Change + Logframe
She clicks "Build."

While she waits (2 minutes), she can SEE the strategy forming:
  - "Researching Andhra Pradesh education data..."
  - "Found: NIPUN Bharat targets, ASER 2022 AP data, Nadu-Nedu results..."
  - "Drafting strategy based on TaRL evidence..."
  - Text starts appearing word by word...

When it's done, she sees:
  - A clean strategy document (reads like a professional wrote it)
  - A Theory of Change diagram she can EDIT by clicking
  - A Logframe table she can EDIT inline
  - An "Export" button: Word, PDF, Excel - one click

She edits 2 items in the ToC (changes "500" to "1000", adds "Telugu language materials")
She clicks "Export to Word" - downloads a .docx she can send to her director.

Total time: 5 minutes.
She feels like she had an expert consultant sitting next to her.

She comes back tomorrow, her program is still there.
She gives feedback: "Add more detail on teacher training"
HubForge revises in 30 seconds. Done.
```

### What's wrong with the current experience (honest audit)

| Step | Current experience | What Priya feels |
|------|-------------------|-----------------|
| Open app | Sees onboarding wizard with 4 steps | "Why am I filling forms? I have 15 minutes." |
| Choose AI | Asked to pick Z.ai or get a key | "I don't know what Z.ai is. I just want to write a proposal." |
| Type problem | Blank textarea with examples | "Is this all? Am I doing it right?" |
| Wait | Single spinner: "Understanding your project..." for 3 minutes | "Is it working? Is it frozen? Should I refresh?" |
| Interview | Asked 3 questions, can skip | "I already told you the problem. Why are you asking more?" |
| Output | Tabs: Strategy / ToC / Logframe | "Good, but I can't edit the diagram. I need to change 500 to 1000." |
| Export | Dropdown with Word/PDF/Excel | "Finally. But I had to hunt for this." |
| Come back | Everything gone (was) / saved (now) | "Wait, where's my program? Oh it's under Programs." |

### The 10 Jobsian principles to apply

1. **Remove steps, don't add them.** Every click is friction. The onboarding 
   should be 1 screen, not 4. The AI choice should be invisible (default to 
   shared, let them upgrade later).

2. **Show, don't tell.** Instead of "Understanding your project...", show 
   the actual research appearing: "Found ASER 2022: AP Class 3 reading: 25%"

3. **Make waiting feel like watching.** The 2-minute generation should be a 
   visual experience - like watching an artist paint. Stream the text.

4. **Default to the most common action.** 90% of users want Strategy + ToC. 
   Pre-select it. 90% use shared Z.ai. Default to it.

5. **One screen, one action.** The dashboard, the workspace, the settings - 
   each should be one clear screen. Don't mix concerns.

6. **Progressive disclosure.** Show the simple version first. Reveal 
   complexity only when the user asks for it (clicks "Advanced").

7. **Make editing obvious.** If something is editable, it should LOOK 
   editable. Blue underlines, cursor changes, "Click to edit" hints.

8. **Make export the hero.** The #1 thing users want is a file to share. 
   The export button should be the most prominent button on the screen.

9. **Remember everything.** The user should never have to re-enter anything. 
   Org context, past programs, preferences - all remembered.

10. **Delight in the details.** Smooth animations, satisfying micro-
    interactions, beautiful typography. The app should feel premium.

### What to change (specific, actionable)

## CHANGE 1: Kill the onboarding wizard. Replace with a single screen.

**Current:** 4-step wizard (welcome -> choose AI -> get key -> profile)
**New:** One screen. "Welcome to HubForge. What's your name?" + "What organization?" + Start.

```
+------------------------------------------+
|          Welcome to HubForge OS           |
|                                          |
|    Build expert strategies in minutes.   |
|                                          |
|    Your name:  [Priya_____________]      |
|    Organization: [REAP____________]       |
|                                          |
|         [ Start building ]                |
|                                          |
|    By starting, you agree to our         |
|    Privacy Policy and Terms.             |
+------------------------------------------+
```

No AI choice. No API key. No role selection. No country dropdown.
Default to shared Z.ai. Let them upgrade in Settings when they're ready.

## CHANGE 2: Make the input screen feel like a conversation, not a form.

**Current:** Blank textarea + output type checkboxes + "Help me build it" button
**New:** Chat-like interface that feels like talking to a consultant.

```
+------------------------------------------+
|  HubForge: What are you working on?      |
|                                          |
|  Priya: Foundation literacy for 1000     |
|  children in 20 AP govt schools          |
|                                          |
|  HubForge: I'll create a Strategy,       |
|  Theory of Change, and Logframe for you. |
|  Researching AP education data now...    |
|                                          |
|  [Building strategy - 45% complete]      |
|  ###################################     |
|                                          |
|  Found: ASER 2022 - AP reading: 25%     |
|  Found: NIPUN Bharat - FLN targets       |
|  Found: Nadu-Nedu - school infra reform  |
|  Drafting strategy...                    |
|                                          |
+------------------------------------------+
```

## CHANGE 3: Stream the output. No more spinner.

**Current:** 3-minute spinner, then full output appears
**New:** Text streams word-by-word as it's generated

The user sees the strategy forming in real-time. This:
- Reduces perceived wait by 80%
- Builds trust (they can see it's working)
- Allows early intervention ("wait, that's wrong" -> stop + correct)

## CHANGE 4: Make editing tactile and obvious.

**Current:** ToC and Logframe are static until you click "Edit"
**New:** Everything is always editable. Visual cues:

- Text fields have subtle blue underlines on hover
- Cursor changes to text cursor (I-beam)
- Clicking any text turns it into an inline editor
- "+ Add" buttons are always visible (not hidden behind edit mode)
- Changes save instantly (no save button - like Google Docs)
- "Saved 2s ago" indicator in the corner

## CHANGE 5: Make export the hero button.

**Current:** Export is in a dropdown menu, same size as "New" button
**New:** Export is the most prominent action after the strategy is ready.

```
+------------------------------------------+
|  Strategy ready - Score 87/100           |
|                                          |
|  [Export Word]  [Export PDF]  [Export    |
|                                        Excel]
|                                          |
|  Or: [Copy text] [Share link]            |
+------------------------------------------+
```

Big, visible, impossible to miss. The user's goal is a file to share.

## CHANGE 6: The dashboard is the home page.

**Current:** User lands on the workspace (input screen)
**New:** User lands on their program dashboard

If they have programs, they see them. If they don't, they see a single 
"New Program" button with a friendly prompt. No empty workspace.

## CHANGE 7: Remove the General/Geek toggle from the header.

**Current:** Two modes visible in header, confusing for layperson
**New:** Default to General. Geek mode accessible via Cmd+K or Settings.

The layperson never needs to see "Geek mode." It's a developer feature.
Hide it. Don't make the user choose.

## CHANGE 8: Auto-save with visual confirmation.

**Current:** No save indicator
**New:** Subtle "Saved" indicator that appears after every change.

Like Google Docs: "All changes saved" in the bottom corner. 
Fades in after a change, fades out after 3 seconds. No anxiety about 
losing work.

## CHANGE 9: Make the progress feel alive.

**Current:** "Understanding your project..." (static text)
**New:** Live progress feed showing what's happening:

```
[Building strategy - 60%]

  [check] Understanding your project
  [check] Researching AP education data
  [check] Gathering frameworks (Theory of Change, Logframe)
  [spin]  Drafting strategy...
  [----]  Reviewing logic
  [----]  Refining draft
  [----]  Scoring quality
  [----]  Building diagrams
```

Each step turns green with a checkmark when done. The current step 
has a spinner. This is deeply satisfying to watch.

## CHANGE 10: One-click templates on the dashboard.

**Current:** Templates exist in code but aren't accessible from UI
**New:** Dashboard shows template cards above "My Programs"

```
+------------------------------------------+
|  Start from a template:                  |
|                                          |
|  [Literacy] [School Feeding] [Water]     |
|  [Agriculture] [Maternal Health]         |
|                                          |
|  Or: [Start from scratch]                |
+------------------------------------------+
```

Click "Literacy" -> pre-fills the problem, ToC, and Logframe with 
TaRL-based template. User customizes. 30 seconds to a 90% draft.
