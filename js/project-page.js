// Loaded by the project pages (html/projects/*.html).
// Shows the language picked in the portfolio (?lang=fr); English by default.
// Texts are written twice in the page: <p lang="en">...</p><p lang="fr">...</p>
const lang = new URLSearchParams(window.location.search).get('lang') === 'fr' ? 'fr' : 'en';
document.documentElement.dataset.lang = lang;
document.documentElement.lang = lang;
