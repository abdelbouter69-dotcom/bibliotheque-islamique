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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[chat] ERREUR: ANTHROPIC_API_KEY absente des variables d'environnement Netlify");
    return {
      statusCode: 500,
      headers: { ...cors, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Clé API manquante côté serveur — ajoutez ANTHROPIC_API_KEY dans Netlify > Environment variables." }),
    };
  }

  console.log("[chat] Clé API présente, longueur:", apiKey.length);

  try {
    let parsed;
    try {
      parsed = JSON.parse(event.body || "{}");
    } catch (parseErr) {
      console.error("[chat] Erreur parsing body:", parseErr.message);
      return {
        statusCode: 400,
        headers: { ...cors, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Corps de requête invalide (JSON attendu)" }),
      };
    }

    const { messages } = parsed;

    if (!Array.isArray(messages) || messages.length === 0) {
      return {
        statusCode: 400,
        headers: { ...cors, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "messages array required" }),
      };
    }

    console.log("[chat] Appel Anthropic avec", messages.length, "message(s)");

    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!apiRes.ok) {
      const errBody = await apiRes.json().catch(() => ({}));
      console.error("[chat] Anthropic API error:", apiRes.status, JSON.stringify(errBody));
      return {
        statusCode: 502,
        headers: { ...cors, "Content-Type": "application/json" },
        body: JSON.stringify({ error: `Erreur API Anthropic (${apiRes.status}). Vérifiez la clé dans Netlify.` }),
      };
    }

    const data = await apiRes.json();
    const textBlock = (data.content || []).find((b) => b.type === "text");
    console.log("[chat] Réponse reçue, stop_reason:", data.stop_reason);

    return {
      statusCode: 200,
      headers: { ...cors, "Content-Type": "application/json" },
      body: JSON.stringify({ text: textBlock ? textBlock.text : "" }),
    };
  } catch (err) {
    console.error("[chat] Exception non gérée:", err.message, err.stack);
    return {
      statusCode: 500,
      headers: { ...cors, "Content-Type": "application/json" },
      body: JSON.stringify({ error: `Erreur serveur: ${err.message}` }),
    };
  }
};
