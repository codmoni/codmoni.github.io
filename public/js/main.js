document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chattingInput');
    const messagesContainer = document.getElementById('messagesContainer');
    // const createRoomForm = document.getElementById('createRoomButton');
    const roomNameInput = document.getElementById('roomName');
    const roomPasswordInput = document.getElementById('roomPassword');
    const roomList = document.getElementById('roomList');
    const newMessageAlert = document.getElementById('newMessageAlert');
    const newRoomAlert = document.getElementById('newRoomAlert');
    const loginModal = document.getElementById('loginModal');
    const loginForm = document.getElementById('loginForm');
    const logoutButton = document.getElementById('logoutButton');
    const roomForm = document.getElementById('roomForm');
    const usernameDisplay = document.getElementById('usernameDisplay')||'';
    const roomNameDisplay = document.getElementById('roomNameDisplay')||'';
    const closeRoomModal = document.getElementById('closeRoomModal');
    const searchInput = document.getElementById('searchInput');

    let room = window.location.pathname.split('/').pop() || 'default';
    let initialLoad = true;
    let lastMessageTimestamp = null;
    let currentUsername = sessionStorage.getItem('username') || '';//session storage에 로그인 정보 저장
    

    const showLoginModal = () => {
        loginModal.style.display = 'block';
        sessionStorage.removeItem(username);
    };

    const hideLoginModal = () => {
        loginModal.style.display = 'none';
    };

    const showRoomModal = () => {
        roomModal.style.display = 'block';
    };

    const hideRoomModal = () => {
        roomModal.style.display = 'none';
    };

    closeRoomModal.addEventListener('click', hideRoomModal);

    //[1] 로그인 ('/register')
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        currentUsername = document.getElementById('username').value.trim();
        console.log('Current User Name: ' + currentUsername);
        if (currentUsername) {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/register', true);
            xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
            xhr.onreadystatechange = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    console.log('User registered successfully');
                    //sessionStorage에 로그인 정보 저장
                    sessionStorage.setItem('username', currentUsername);
                    hideLoginModal();
                    fetchRooms();
                    // fetchMessages();
                    usernameDisplay.textContent = currentUsername;
                }else {
                    console.error('Error registering user:', xhr.responseText);
                }
            };
            xhr.onerror = function() {
                console.error('Error registering user:', xhr.statusText);
            };
            xhr.send(JSON.stringify({ username: currentUsername }));//request body
        } else {
            console.error('Username is empty');
        }
    });
    
    //[2] 로그아웃
    logoutButton.addEventListener('click', ()=>{
        sessionStorage.removeItem('username');
        currentUsername='';
        showLoginModal();
        roomList.innerHTML = '';
        messagesContainer.innerHTML = '';
    })

    createRoomButton.addEventListener('click', showRoomModal);

    //[3] 참여 중인 채팅방 목록 반환('/rooms/:username')
    const fetchRooms = () => {
        currentUsername = sessionStorage.getItem('username');
        if(currentUsername){
            const xhr = new XMLHttpRequest();
            xhr.open('GET', `/rooms/${currentUsername}`, true);
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    console.log(xhr.responseText);
                    const rooms = JSON.parse(xhr.responseText);
                    displayRooms(rooms);
                } else {
                    console.error('Error fetching rooms:', xhr.statusText);
                }
            };
            xhr.onerror = function() {
                console.error('Error fetching rooms:', xhr.statusText);
            };
            xhr.send();
        }
    };

    //[4] 채팅 내용 반환('/messages/:room')
    const fetchMessages = () => {
        if(currentUsername){//로그인 상태일 때
            const xhr = new XMLHttpRequest();
            xhr.open('GET', `/messages/${room}`, true);
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const messages = JSON.parse(xhr.responseText);
                    const oldMessagesLength = messagesContainer.children.length;
                    const wasScrolledToBottom = isScrolledToBottom();
                    displayMessages(messages);
                    if (initialLoad) {
                        scrollToBottom();
                        initialLoad = false;
                    } else if (messages.length > 0) {
                        const latestMessageTimestamp = new Date(messages[messages.length - 1].timestamp).getTime();
                        if (lastMessageTimestamp && latestMessageTimestamp > lastMessageTimestamp) {
                            if (messages.length > oldMessagesLength && messages[messages.length - 1].username !== currentUsername) {
                                if (!wasScrolledToBottom) {
                                    showNewMessageAlert();
                                } else {
                                    scrollToBottom();
                                }
                            } else {
                                scrollToBottom();
                            }
                        }
                        lastMessageTimestamp = latestMessageTimestamp;
                    }
                } else {
                    console.error('Error fetching messages:', xhr.statusText);
                }
            };
            xhr.onerror = function() {
                console.error('Error fetching messages:', xhr.statusText);
            };
            xhr.send();
        }else return;
    };

    //[5] 메세지 전송('/send')
    const sendMessage = () => {
        const message = chatInput.value.trim();
        currentUsername = sessionStorage.getItem('username');//로그인 정보 불러오기
        if (message) {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/send', true);
            xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    chatInput.value = '';
                    fetchMessages();
                    scrollToBottom();
                } else {
                    console.error('Error sending message(1):', xhr.statusText);
                }
            };
            xhr.onerror = function() {
                console.error('Error sending message(2):', xhr.statusText);
            };
            xhr.send(JSON.stringify({ username: currentUsername, room, message }));
        }
    };

    //[6] 채팅방 생성('/create-room')
    roomForm.addEventListener('submit',(e)=>{
        e.preventDefault();
        const roomName = roomNameInput.value.trim();
        const roomPassword = roomPasswordInput.value.trim()||'';
        currentUsername = sessionStorage.getItem('username');
        
        if (roomName) {
            room = roomName;
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/create-room', true);
            xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    hideRoomModal();
                    initialLoad = true;
                    fetchRooms();
                    // fetchMessages();
                    newRoomAlert.classList.add('show');
                    setTimeout(() => {
                        newRoomAlert.classList.remove('show');
                    }, 5000);
                    roomNameDisplay.textContent = roomName;
                    roomNameInput.value = '';
                    roomPasswordInput.value='';
                    window.history.pushState(null, null, `/${roomName}`);
                    room = roomName; // URL 변경 후 room 변수 업데이트
                } else {
                    console.error('Error creating room(1):', xhr.statusText);
                }
            };
            xhr.onerror = function() {
                console.error('Error creating room(2):', xhr.statusText);
            };
            xhr.send(JSON.stringify({ username:currentUsername, room, roomPassword, message:'.' }));
        }
    })

    const isScrolledToBottom = () => {
        return messagesContainer.scrollHeight - messagesContainer.scrollTop <= messagesContainer.clientHeight + 1;
    };

    const showNewMessageAlert = () => {
        if (!newRoomAlert.classList.contains('show')) {
            newMessageAlert.classList.add('show');
            setTimeout(() => {
                if (newMessageAlert.classList.contains('show')) {
                    newMessageAlert.classList.remove('show');
                }
            }, 5000);
        }
    };
    
    searchInput.addEventListener('input',()=>{       
        const normalizeString = (str) => {
            return str.normalize('NFC').toLowerCase(); // Normalize to NFC and convert to lowercase
        };
        const searchTerm = normalizeString(searchInput.value);
        const rooms = Array.from(document.querySelectorAll('#roomList li'));

        rooms.forEach(roomElement =>{
            const roomName = normalizeString(roomElement.querySelector('span').textContent);
            if(!roomName.includes(searchTerm)){
                roomElement.style.display='none';
            }
        })
    })

    //[7] 채팅방 목록 보이기 + 채팅방 삭제('/delete-room')
    const displayRooms = (rooms) => {
        roomList.innerHTML = '';
        currentUsername = sessionStorage.getItem('username');//로그인 정보 불러오기
        
        const normalizeString = (str) => {
            return str.normalize('NFC').toLowerCase(); // Normalize to NFC and convert to lowercase
        };
        const searchTerm = normalizeString(searchInput.value);

        rooms.forEach(roomName => {
            const roomElement = document.createElement('li');
            roomElement.className = 'd-flex justify-content-between align-items-center';
            roomElement.innerHTML = `
                <span>${roomName}</span>
                <button class="btn btn-danger btn-sm delete-button" style="color:black; height: 13px; font-size:13px; padding:0px;">X</button>
            `;

            roomElement.querySelector('.delete-button').addEventListener('click', (e) => {
                e.stopPropagation();//이벤트 버블링을 막기 위함
                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/delete-room', true);
                xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
                xhr.onload = function() {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        roomList.removeChild(roomElement);
                        messagesContainer.innerHTML = '';
                        roomNameDisplay.textContent = 'Create or Join Chatting Room!';
                        window.history.pushState(null, null, '/'); // URL 변경
                        room = ''; // 현재 방 초기화
                    } else {
                        console.error('Error deleting room');
                    }
                };
                xhr.onerror = function() {
                    console.error('Error deleting room');
                };
                xhr.send(JSON.stringify({ username: currentUsername, roomName }));
            });

            roomElement.addEventListener('click', () => {
                // document.querySelectorAll('#roomList li').forEach(li => li.classList.remove('selected-room'));
                // roomElement.classList.add('selected-room');
                window.history.pushState(null, null, `/${roomName}`);
                room = roomName;
                initialLoad = true;
                roomNameDisplay.textContent = room;
                fetchMessages();
            });

            // 검색어 필터링 적용
            const normalizedRoomName = normalizeString(roomName);
            if (!normalizedRoomName.includes(searchTerm)) {
                roomElement.style.display = 'none';
            }

            roomList.appendChild(roomElement);
        });
    };

    const displayMessages = (messages) => {
        messagesContainer.innerHTML = '';
        messages.slice(1).forEach(({ username, message, timestamp }) => {
            const messageElement = document.createElement('li');
            messageElement.className = 'd-flex justify-content-between mb-4';
            messageElement.innerHTML = `
                <div class="card ${username === currentUsername ? 'my-message' : 'their-message'}">
                    <div class="card-footer d-flex justify-content-between p-3">
                        ${username === currentUsername ? `
                            <p class="text-muted small mb-0 timestamp" style="font-size: 12px; color:grey;">
                                <i class="far fa-clock"></i> ${new Date(timestamp).toLocaleTimeString()}
                            </p>
                            <p class="fw-bold mb-0 username">${username}</p>
                        ` : `
                            <p class="fw-bold mb-0 username">${username}</p>
                            <p class="text-muted small mb-0 timestamp" style="font-size: 12px; color:grey;">
                                <i class="far fa-clock"></i> ${new Date(timestamp).toLocaleTimeString()}
                            </p>
                        `}
                    </div>
                    <div class="card-body">
                        <p class="mb-0">${message}</p>
                    </div>
                </div>
            `;
            messagesContainer.appendChild(messageElement);
        });
    };



    const scrollToBottom = () => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        newMessageAlert.classList.remove('show');
    };

    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    newMessageAlert.addEventListener('click', () => {
        newMessageAlert.classList.remove('show');
        scrollToBottom();
    });

    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');

    sidebarToggle.addEventListener('click', () => {
        if (sidebar.classList.contains('closed')) {
            sidebar.classList.remove('closed');
            sidebar.classList.add('open');
        } else {
            sidebar.classList.remove('open');
            sidebar.classList.add('closed');
        }
    });

    setInterval(fetchRooms, 1000);
    setInterval(fetchMessages, 3000);
    showLoginModal();
});
