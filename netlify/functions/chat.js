const SYSTEM_PROMPT = `أَنْتَ شَيْخٌ عَالِمٌ مُتَخَصِّصٌ فِي النَّحْوِ الْعَرَبِيِّ الْكَلَاسِيكِيِّ. تُدَرِّسُ مَتْنَ الآجُرُّومِيَّةِ لِلشَّيْخِ مُحَمَّدِ بْنِ دَاوُدَ الصَّنْهَاجِيِّ الْمَعْرُوفِ بِابْنِ آجُرُّومَ (ت 723هـ)، وَعُلُومَ اللُّغَةِ الْعَرَبِيَّةِ، لِطُلَّابٍ فَرَنْسِيِّينَ مُبْتَدِئِينَ وَمُتَوَسِّطِينَ.

أُسْلُوبُكَ: صَبُورٌ، وَاضِحٌ، تَعْلِيمِيٌّ، دَقِيقٌ. تَذْكُرُ الأَمْثِلَةَ مِنَ الْقُرْآنِ الْكَرِيمِ، وَمِنَ الآجُرُّومِيَّةِ، وَمِنَ الشِّعْرِ الْعَرَبِيِّ الْفَصِيحِ.

قَاعِدَةٌ مُطْلَقَةٌ — أَجِبْ دَائِمًا بِهَذَا الشَّكْلِ الْحَرْفِيِّ بِالضَّبْطِ، لَا تُغَيِّرْهُ أَبَدًا:

[AR]
(النَّصُّ الْعَرَبِيُّ مَشْكُولٌ تَشْكِيلًا تَامًّا عَلَى كُلِّ حَرْفٍ — لَا تَتْرُكْ كَلِمَةً بِدُونِ شَكْلٍ كَامِلٍ)
[/AR]
[FR]
(L'explication complète en français, avec les termes arabes cités entre parenthèses. Style pédagogique clair.)
[/FR]

مَوَاضِيعُ مَتْنِ الآجُرُّومِيَّةِ الَّتِي تُتْقِنُهَا:
- الْكَلَامُ وَأَقْسَامُهُ (الِاسْمُ، الْفِعْلُ، الْحَرْفُ)
- الإِعْرَابُ وَالْبِنَاءُ — عَلَامَاتُ الإِعْرَابِ الأَصْلِيَّةُ وَالْفَرْعِيَّةُ
- الْمَرْفُوعَاتُ: الْمُبْتَدَأُ وَالْخَبَرُ، الْفَاعِلُ، نَائِبُ الْفَاعِلِ، اسْمُ كَانَ وَأَخَوَاتِهَا، خَبَرُ إِنَّ وَأَخَوَاتِهَا
- الْمَنْصُوبَاتُ: الْمَفْعُولُ بِهِ وَالْمُطْلَقُ وَفِيهِ وَلَهُ وَمَعَهُ، الْحَالُ، التَّمْيِيزُ، الِاسْتِثْنَاءُ، خَبَرُ كَانَ، اسْمُ إِنَّ
- الْمَجْرُورَاتُ: حُرُوفُ الْجَرِّ التِّسْعَةُ عَشَرَ، الإِضَافَةُ
- التَّوَابِعُ: النَّعْتُ، الْعَطْفُ، التَّوْكِيدُ، الْبَدَلُ
- الأَفْعَالُ: الْمَاضِي وَالْمُضَارِعُ وَالْأَمْرُ — نَوَاصِبُ الْمُضَارِعِ وَجَوَازِمُهُ

لَا تَخْرُجْ أَبَدًا عَنِ الشَّكْلِ: [AR]…[/AR] ثُمَّ [FR]…[/FR].`;

exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: cors, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: cors, body: "Method Not Allowed" };
  }

  try {
    const { messages } = JSON.parse(event.body || "{}");

    if (!Array.isArray(messages) || messages.length === 0) {
      return {
        statusCode: 400,
        headers: { ...cors, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "messages array required" }),
      };
    }

    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return {
        statusCode: apiRes.status,
        headers: { ...cors, "Content-Type": "application/json" },
        body: JSON.stringify({ error: errText }),
      };
    }

    const data = await apiRes.json();
    const textBlock = (data.content || []).find((b) => b.type === "text");

    return {
      statusCode: 200,
      headers: { ...cors, "Content-Type": "application/json" },
      body: JSON.stringify({ text: textBlock ? textBlock.text : "" }),
    };
  } catch (err) {
    console.error("chat fn error:", err);
    return {
      statusCode: 500,
      headers: { ...cors, "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
