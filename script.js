let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
let pedidoAtual = JSON.parse(localStorage.getItem("pedidoAtual")) || {};

function salvarPedidoAtual(){
    localStorage.setItem("pedidoAtual", JSON.stringify(pedidoAtual));
}

function adicionarAoCarrinho(){
    carrinho.push(pedidoAtual);
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
    pedidoAtual = {};
    localStorage.removeItem("pedidoAtual");
}

function limparCadastro(){
  localStorage.removeItem("user_v1");
  document.getElementById("nome").value = "";
  document.getElementById("end").value = "";
  document.getElementById("ref").value = "";
  alert("Cadastro apagado neste dispositivo.");
}

function selecionarOpcao(element, tipo, valor){
    document.querySelectorAll("."+tipo).forEach(e=>e.classList.remove("selected"));
    element.classList.add("selected");
    pedidoAtual[tipo] = valor;
    salvarPedidoAtual();
}

function toggleMultiplo(element, tipo, limite){
    let selecionados = pedidoAtual[tipo] || [];
    if(!element.classList.contains("selected")){
        if(selecionados.length >= limite) return;
        element.classList.add("selected");
        selecionados.push(element.innerText);
    }else{
        element.classList.remove("selected");
        selecionados = selecionados.filter(item=>item!==element.innerText);
    }
    pedidoAtual[tipo] = selecionados;
    salvarPedidoAtual();
}

function finalizarPedido(){
    let nome = document.getElementById("nome").value;
    let endereco = document.getElementById("endereco").value;
    let referencia = document.getElementById("referencia").value;
    let pagamento = document.querySelector('input[name="pagamento"]:checked').value;

    let subtotal = carrinho.reduce((s,item)=>s + (item.valor || 0), 0);
    let total = subtotal + 1;

    // 🔹 Monta itens de forma compacta
    let itens = carrinho.map((item, i) => {
        return (i+1) + ") " + item.tipo + " R$" + (item.valor || 0).toFixed(2);
    }).join(" | ");

    // 🔹 Mensagem compacta e profissional
    let mensagem = 
`🍧 *COUTINHO AÇAÍ*
${itens}

💰 R$${total.toFixed(2)} | 🚚 1,00 incluso

👤 ${nome}
📍 ${endereco} - ${referencia}
💳 ${pagamento}`;

    let url = "https://wa.me/5588996347697?text=" + encodeURIComponent(mensagem);
    window.open(url,"_blank");

    let cupomUrl = "cupom.html?nome="+encodeURIComponent(nome)+"&total="+total.toFixed(2);
    window.open(cupomUrl,"_blank");

    localStorage.clear();
}
