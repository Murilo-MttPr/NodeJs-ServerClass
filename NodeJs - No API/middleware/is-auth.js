module.exports = (req, res, next) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/login');
    }
    next();
}

// Aqui criamos uma função para testar se o usuario esta logado. simples. e apos o teste, chama next
// Requerimos essa funcao la na folder routes, e como la esta nossas rotas ex: /produtos , e nas funcoes das rotas, após a rota existe a funcao pra onde ela vai quando acessada, antes de onde ela vai adicionamos essa funcao antes (nomeamos uma variavel no arquivo das rotas e como aqui só exporta essa funcao ela requere esse arquivo aqui q executa essa funcao quando chamado) Ex:

//  router.get('/products',isAuth, adminController.getProducts);

// temos a rota /produts, depois ela aceita quantos argumentos forem, colocamos o isAuth pra executar a funcao e caso de true, o 'next' para pra frente, chamando o proximo argumento da linha, que é no caso o adminController