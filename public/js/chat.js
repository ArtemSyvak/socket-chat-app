const socket = io()

// Elemetns
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Utils
const formatMessageDate = (date) => moment(date).format('h:mm a')

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = () => {
    const $newMessage = $messages.lastElementChild

    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // visible height
    const visibleHeight = $messages.offsetHeight

    // messages container height
    const containerHeight = $messages.scrollHeight

    // how fare have to scroll
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', message => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: formatMessageDate(message.createdAt)
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('locationMessage', locationMessage => {
    const html = Mustache.render(locationMessageTemplate, {
        username: locationMessage.username,
        url: locationMessage.url,
        createdAt: formatMessageDate(locationMessage.createdAt)
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })

    $sidebar.innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    
    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value    
    socket.emit('sendMessage', message, (error) => {
        
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if(error){
            return console.log(error)
        }

        console.log('Message delivered!')
    })
})

$sendLocationButton.addEventListener('click', () => {
    
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser.')
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {       
        $sendLocationButton.removeAttribute('disabled')

        const { latitude, longitude } = position.coords
        socket.emit('sendLocation', `https://google.com/maps?q=${latitude},${longitude}`, status => {           
            console.log('Message Status:', status)
        })
    })
})


socket.emit('join', {
    username,
    room
}, (error) => {
    if(error){
        alert(error)
        location.href = '/'
    }
})
