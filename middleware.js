// middleware.js — Vercel Edge Middleware
// Bloqueia acesso direto a arquivos .html
// Rotas limpas e assets passam normalmente

export const config = {
    matcher: ['/((?!_next|_vercel|fonts|icons|sw\\.js|manifest\\.json|.*\\.css|.*\\.js|.*\\.png|.*\\.jpg|.*\\.webp|.*\\.ico|.*\\.woff2|.*\\.mp3|.*\\.lrc|.*\\.html).*)'],
};

export default function middleware(request) {
    const path = new URL(request.url).pathname;

    // Bloqueia acesso direto a .html — retorna 404
    if (path.endsWith('.html')) {
        return new Response('Not Found', { status: 404 });
    }

    // Tudo mais passa normalmente (rotas limpas, assets, etc)
}
