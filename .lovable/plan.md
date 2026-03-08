

## Plan: Real-Time Voice Call Mode with ElevenLabs Conversational AI

### Root Cause of Current Failure

The edge function logs show two clear errors:
1. **ElevenLabs**: `"missing_permissions" — "The API key you used is missing the permission text_to_speech"` — Your ElevenLabs API key doesn't have TTS permission enabled.
2. **Deepgram**: `"Bad Request" — "Invalid query string"` — encoding parameter mismatch.

But since you want to move to a **true real-time call mode** (like Microsoft Edge voice-to-voice), we'll replace the current push-to-talk architecture entirely with **ElevenLabs Conversational AI**, which handles both STT and TTS in a single WebRTC connection.

### What You Need to Do in ElevenLabs First

Before I can build this, you need to set up an **ElevenLabs Conversational AI Agent**:

1. Go to [ElevenLabs Dashboard](https://elevenlabs.io/app/conversational-ai) → **Conversational AI** → **Create Agent**
2. Configure the agent with your desired voice, personality prompt (e.g., "You are Hyper AI, a supportive medical assistant for hyperhidrosis patients..."), and first message
3. Copy the **Agent ID** — you'll need to give it to me
4. Make sure your API key has the **Conversational AI** permission enabled (check API key settings)

### Implementation Steps

**1. Install `@elevenlabs/react` SDK**
- Add the package for the `useConversation` hook

**2. Create edge function: `elevenlabs-conversation-token`**
- Server-side token generation to keep API key secure
- Calls `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=AGENT_ID`
- Returns short-lived token to client

**3. Update `HyperAI.tsx` — Add real-time call mode**
- Add `useConversation` hook from `@elevenlabs/react`
- When user taps the phone/voice button: request mic permission → get token from edge function → start WebRTC session
- Show live call UI: pulsing indicator when agent is speaking, "listening" state when user talks
- No recording, no processing delay — continuous real-time conversation
- Keep existing text chat and voice-to-text (dictation) as separate features

**4. Call UI changes**
- Replace the current record/stop flow with a "Start Call" / "End Call" toggle
- Show real-time status: "Connected", "Agent speaking", "Listening"
- Optional: show transcripts of both sides in the chat as they happen

### Architecture Comparison

```text
CURRENT (broken):
  Record audio → base64 → Edge Function → Deepgram STT → text
  → Gemini AI → text → ElevenLabs TTS → audio back

NEW (real-time call):
  Tap "Call" → WebRTC connection to ElevenLabs Agent
  → Continuous bidirectional voice (no delays, no processing steps)
```

### What I Need From You

1. Create the ElevenLabs Conversational AI agent and give me the **Agent ID**
2. Confirm your ElevenLabs API key has the **Conversational AI** permission enabled
3. Tell me the system prompt / personality you want for the voice agent (or I'll reuse the existing Hyper AI prompt from the chat)

