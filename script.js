/* ==================== AI英語チャット ==================== */

// ★ Cloudflare Worker のURL（あなた専用）
const API_ENDPOINT = "https://winter-scene-288dtoeic-chat-gpt.masayaking.workers.dev/";

// チャット画面の表示
function startChat(){
    playSE(seClick);
    show("chat");
    if (chatLog) chatLog.innerHTML = "";
    addBotMessage(
        "こんにちは！AI英語チャットです。\n" +
        "翻訳、例文、添削、TOEIC対策など英語の質問なら何でもどうぞ！\n\n" +
        "例：\n" +
        "・「increase ってどういう意味？」\n" +
        "・「営業メールの文面を英語で作って」\n" +
        "・「この日本語を英訳して→ 明日10時に打ち合わせをしたいです」\n"
    );
}

function addMessage(text, isUser){
    const div = document.createElement("div");
    div.className = "chat-bubble " + (isUser ? "user" : "bot");
    div.textContent = text;
    chatLog.appendChild(div);
    chatLog.scrollTop = chatLog.scrollHeight;
}

function addUserMessage(text){ addMessage(text, true); }
function addBotMessage(text){ addMessage(text, false); }

// Worker API を呼び出す
async function callChatAPI(userMessage){
    const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage })
    });

    if (!res.ok){
        console.error("API error:", await res.text());
        throw new Error("API error");
    }

    const data = await res.json();
    return data.reply;
}

// 送信処理（ボタン or Enter）
async function handleChatSend(customText){
    const text = (typeof customText === "string" ? customText : chatInput.value).trim();
    if (!text) return;

    addUserMessage(text);
    chatInput.value = "";

    // 「考え中…」の仮メッセージ
    addBotMessage("考え中…");
    const thinking = chatLog.lastChild;

    try {
        const reply = await callChatAPI(text);
        thinking.textContent = reply;
    } catch (e){
        console.error(e);
        thinking.textContent = "エラーが発生しました。API設定を確認してください。";
    }
}
