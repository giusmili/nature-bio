
# Application dédié aux soins de nos plantes
>Projet d’application capable d’identifier l’espèce d’une plante, d’évaluer son état de santé à partir d’une photo et de fournir des conseils et traitements adaptés. L’application doit fonctionner sur mobile et ordinateur ; elle utilise Next.js pour le développement web et fait appel à des modèles d’apprentissage automatique pour la classification d’images.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Optionally set your Gemini key in [.env.local](.env.local): `VITE_GEMINI_API_KEY=your_key_here` (the app also accepts `GEMINI_API_KEY` for backward compatibility). Without a key the app will return a mock analysis.
3. Run the app:
   `npm run dev`
