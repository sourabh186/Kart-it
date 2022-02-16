import axios from 'axios'


let addToProduct = document.querySelectorAll('.addToProduct')
let cartCounter = document.querySelector('#cartCounter')
let orderNow = document.querySelector('#orderNow')


function updateProduct(product) {
    axios.post('/success-buy', product).then(res => {
        cartCounter.innerText = res.data.totalQnty
    }).catch(err => {
        console.log(err);
    })
}

addToProduct.forEach((btn) => {
    btn.addEventListener('click', (e) => {
        let product = JSON.parse(btn.dataset.product)
        updateProduct(product)
        console.log(product);
        
    })
})

orderNow.addEventListener('click', (e) => {
    e.preventDefault()
    alert('Your order is successfully placed')
})