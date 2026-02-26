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

    let subtotal = carrinho.reduce((s,item)=>s+item.valor,0);
    let total = subtotal + 1;

    let mensagem = "🍧 *COUTINHO AÇAÍ*%0A%0A";
    carrinho.forEach((item,i)=>{
        mensagem += "Pedido "+(i+1)+": "+item.tipo+" - R$"+item.valor+"%0A";
    });
    mensagem += "%0A💰 Subtotal: R$"+subtotal.toFixed(2);
    mensagem += "%0A🚚 Entrega: R$1,00";
    mensagem += "%0A💵 Total: R$"+total.toFixed(2);
    mensagem += "%0A%0A👤 "+nome;
    mensagem += "%0A📍 "+endereco;
    mensagem += "%0A📌 "+referencia;
    mensagem += "%0A💳 "+pagamento;

    let url = "https://wa.me/5588996347697?text="+mensagem;
    window.open(url,"_blank");

    let cupomUrl = "cupom.html?nome="+nome+"&total="+total.toFixed(2);
    window.open(cupomUrl,"_blank");

    localStorage.clear();

}
