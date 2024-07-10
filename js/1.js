class Utils {
    static escapeHtml(unsafe) {
        return unsafe ? unsafe.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
    }

    static formattedDate(timestamp, formatType) {
        const date = new Date(timestamp);

        const formats = {
            day: date.toLocaleDateString('ru-RU', { day: '2-digit' }), // 21
            dayShort: date.toLocaleDateString('ru-RU', { weekday: 'short' }), // Пн
            dayLong: date.toLocaleDateString('ru-RU', { weekday: 'long' }), // Понедельник
            time: date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), // 21:50
            dateLong: date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' }), // 21 мая
            monthYear: date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }), // Май 2024
            dateFull: date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }), // 21.05.2024
        };

        return formats[formatType];
    }


    static getFormattedDate(timestamp) {
        const date = new Date(timestamp);
        const toDay = new Date();

        if (this.formattedDate(date, 'dateFull') === this.formattedDate(toDay, 'dateFull')) {
            return 'Сегодня';
        } else if (date.getDate() === toDay.getDate() - 1 && date.getMonth() === toDay.getMonth() && date.getFullYear() === toDay.getFullYear()) {
            return 'Вчера';
        } else if (date.getFullYear() < toDay.getFullYear()) {
            return this.formattedDate(date, 'dateFull');
        } else {
            return this.formattedDate(date, 'dateLong');
        }
    }

    static generateGradientFromId(id) {
        const hashString = id.toString();

        let hash = 0;
        for (let i = 0; i < hashString.length; i++) {
            hash = hashString.charCodeAt(i) + ((hash << 5) - hash);
        }

        const color1 = `#${Math.abs(hash).toString(16).slice(0, 6)}`;
        const color2 = `#${Math.abs(hash * 31337).toString(16).slice(0, 6)}`;

        return `linear-gradient(to bottom right, ${color1}, ${color2})`;
    }

    static smoothScrollToElement(targetElement, duration = 500) {
        const container = document.querySelector('.messages-container');
        const startPosition = container.scrollTop;
        const targetPosition = targetElement.offsetTop - container.offsetTop;
        const distance = targetPosition - startPosition;
        let startTime = null;

        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = Math.min(timeElapsed / duration, 1);
            const easeInOutCubic = run < 0.5 ? 4 * run * run * run : (run - 1) * (2 * run - 2) * (2 * run - 2) + 1;
            container.scrollTop = startPosition + distance * easeInOutCubic;

            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            }
        }

        requestAnimationFrame(animation);
    }

    static smoothScrollByMessageId(id, duration = 500) {
        const targetElement = document.querySelector(`.message[href="${id}"]`);

        if (targetElement) {
            Utils.smoothScrollToElement(targetElement, duration);
            Utils.highlightElement(targetElement);
        } else {
            Utils.loadMoreMessagesAndScroll(id, duration);
        }
    }

    static loadMoreMessagesAndScroll(id, duration = 500) {
        const container = document.querySelector('.messages-container');
        const initialScrollHeight = container.scrollHeight;
        container.scrollTop = -container.scrollHeight; 
    
        setTimeout(() => {
            if (container.scrollHeight > initialScrollHeight) {
                Utils.smoothScrollByMessageId(id, duration);
            }
        }, 1000);
    }
    

    static highlightElement(element) {
        var element = element.querySelector('.message-item');
        element.style.animation = 'none';
        setTimeout(function() {
            element.style.animation = 'highlight 2s ease-in-out';
        }, 50);
    }

    static getMessagePreview(message_text, content_type) {
        switch (content_type) {
            case 'photo':
                return 'Фотография';
            case 'video':
                return 'Видео';
            case 'animation':
                return 'GIF';
            case 'document':
                return 'Документ';
            case 'sticker':
                return 'Стикер';
            default:
                return Utils.escapeHtml(message_text);
        }
    }
}



class Chat {
    constructor(chatId, title, Message, MessageId, contentType) {
        this.chatId = chatId;
        this.title = title;
        this.Message = Message;
        this.MessageId = MessageId;
        this.contentType = contentType;
    }

    render() {
        const chatElement = document.createElement('div');
        chatElement.classList.add('chat');
        chatElement.setAttribute('data-chat-id', this.chatId);
        chatElement.setAttribute('data-message-id', this.MessageId);

        const avatarElement = document.createElement('div');
        avatarElement.classList.add('chat-avatar');
        avatarElement.style.background = Utils.generateGradientFromId(this.chatId);
        avatarElement.textContent = this.title.charAt(0).toUpperCase();

        const chatItemElement = document.createElement('div');
        chatItemElement.classList.add('chat-item');

        const titleElement = document.createElement('div');
        titleElement.classList.add('chat-name');
        titleElement.textContent = this.title;

        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message');
        messageElement.textContent = this.Message || Utils.getMessagePreview(this.Message, this.contentType);

        chatItemElement.appendChild(titleElement);
        chatItemElement.appendChild(messageElement);
        chatElement.appendChild(avatarElement);
        chatElement.appendChild(chatItemElement);

        return chatElement;
    }
}

class Message {
    constructor(name, surname, user_id, message_text, time_stamp, reply_to, content_type = '', content_name = '', message_id) {
        this.name = name;
        this.surname = surname;
        this.user_id = user_id;
        this.message_text = message_text;
        this.time_stamp = time_stamp*1000;
        this.reply_to = reply_to;
        this.content_type = content_type;
        this.content_name = content_name;
        this.message_id = message_id;
    }

    render() {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.setAttribute('href', `#${this.message_id}`);
        messageElement.setAttribute('data-user-id', this.user_id);
        
        const replyMarkup = this.reply_to ? `
            <div class="message-reply" onclick="Utils.smoothScrollByMessageId('#${this.reply_to.message_id}', 500)">
                <div class="message-reply-text">${this.reply_to.name} ${this.reply_to.surname}: ${Utils.getMessagePreview(this.reply_to.message_text || '', this.reply_to.content_type)}</div>
            </div>
        ` : '';

        const contentMarkup = this.content_type ? this.getContent(this.content_type, this.content_name) : '';
        const gradient = Utils.generateGradientFromId(this.user_id);

        messageElement.innerHTML = `
            <div class="message-avatar" style="background: ${gradient};"> ${this.name.charAt(0).toUpperCase()}${this.surname.charAt(0).toUpperCase()}</div>
            <div class="message-item">
                <div class="message-author">${this.name} ${this.surname}</div>
                ${replyMarkup}
                ${contentMarkup}
                <div class="message-text">${Utils.escapeHtml(this.message_text)}</div>
                <div class="message-time">${Utils.formattedDate(this.time_stamp, 'time')}</div>
            </div>
        `;

        return messageElement;
    }

    getContent(contentType, contentName) {
        const baseUrl = 'http://10.8.1.68:33720/content/';

        switch (contentType) {
            case "text":
                return Utils.escapeHtml(contentName);
            case "photo":
                return `<a data-fancybox="gallery" data-src="${baseUrl}${contentName}"><img src="${baseUrl}${contentName}" alt="photo" class="message-media-photo"></a>`;
            case "video":
                return `<video controls class="message-media-video"><source src="${baseUrl}${contentName}" type="video/mp4">Your browser does not support the video tag.</video>`;
            case "animation":
                return `<video autoplay loop muted class="message-media-gif"><source src="${baseUrl}${contentName}" type="video/mp4">Your browser does not support the video tag.</video>`;
            case "document":
                let fileExtension = contentName.split('.').pop().toUpperCase();
            
                return `<a href="${baseUrl}${contentName}" download class="message-media-document">
                    <div class="document-icon">${fileExtension}</div>
                    <div class="document-details">
                        <div class="document-name">${contentName}</div>
                    </div></a>`;
                

                // `<a href="${baseUrl}${contentName}" download class="message-media-document">Download Document</a>`;
            case "voice":
                return `В активной разработке, я хз`;
            case "sticker":
                if (contentName.endsWith(".webm")) {
                    return `<video autoplay loop muted class="message-media-sticker"><source src="${baseUrl}${contentName}" type="video/webm">Your browser does not support the video tag.</video>`;
                } else if (contentName.endsWith(".webp")) {
                    return `<img src="${baseUrl}${contentName}" class="message-media-sticker">`;
                }
                break;
            default:
                return '';
        }
    }

    static createFromData(messageData) {
        const { first_name, last_name, user_id } = messageData.user;
        const { message_text, message_timestamp, content_type, content_name, message_id } = messageData.message;
        let reply_to = null;

        if (messageData.reply_to) {
            const { message: replyMessage, user: replyUser } = messageData.reply_to;
            reply_to = {
                name: replyUser.first_name,
                surname: replyUser.last_name,
                content_type: replyMessage.content_type,
                message_text: replyMessage.message_text,
                message_id: replyMessage.message_id
            };
        }

        return new Message(first_name, last_name, user_id, message_text, message_timestamp, reply_to, content_type, content_name, message_id);
    }
}

class ChatApp {
    constructor(socketUrl) {
        this.socket = new WebSocket(socketUrl);
        this.handleSocket();
        this.searchInput = document.querySelector('.search-input');
        this.chatsContainer = document.querySelector('.chats-container');
        this.chatsInfoContainer = document.querySelector('.chats-info-container');
        this.messagesContainer = document.querySelector('.messages-container');
        this.messagesContainer.addEventListener('scroll', () => this.handleScroll());
        this.searchInput.addEventListener('keydown', (event) => this.handleSearch(event));
        this.lastResponseWasEmpty = false;
        this.currentLastMessageId = null;
        this.pollingInterval = null;
        this.currentChatId = null;
        this.currentPage = 0;
        this.isLoading = false;
    }

    handleSocket() {
        this.socket.onmessage = (event) => {
            const Data = JSON.parse(event.data);
            if (Data.messages && Data.messages.length === 0) {
                this.lastResponseWasEmpty = true;
                return;
            } else {
                this.lastResponseWasEmpty = false;

                if (Data.hasOwnProperty('chats')) {
                    this.updateChats(Data.chats);
                } else if (Data.hasOwnProperty('messages')) {
                    this.updateMessages(Data.messages);
                } else if (Data.hasOwnProperty('new_messages')) {
                    this.updateNewMessages(Data.new_messages);
                } else if (Data.hasOwnProperty('search_messages')) {
                    this.updateChats(Data.search_messages);
                } else {
                    console.error("Unexpected data format:", Data);
                }
            }
        };

        this.socket.onclose = () => {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            this.chatsContainer.innerHTML = '<div class="no-chats">Произошла ошибка сети.</div>';
            this.chatsInfoContainer.innerHTML = '';
            this.messagesContainer.innerHTML = '';
            this.messagesContainer.setAttribute('style', 'height: 100vh');
        };
    }

    updateChats(Data) {
        const fragment = document.createDocumentFragment();
        this.chatsContainer.innerHTML = '';
    
        const addHeader = (text) => {
            const header = document.createElement('div');
            header.className = 'header';
            header.textContent = text + ':';
            fragment.appendChild(header);
        };
    
        const processData = (dataArray, type) => {
            if (dataArray && dataArray.length > 0) {
                if (type) {
                    addHeader(type);
                }
                dataArray.forEach(item => this.appendChatElement(fragment, item));
                const line = document.createElement('div');
                line.className = 'line';
                fragment.appendChild(line);

            }
        };
    
        if (Array.isArray(Data)) {
            processData(Data);
        } else {
            if (Data.chats) processData(Data.chats, 'Чаты');
            if (Data.messages) processData(Data.messages, 'Сообщения');
        }
    
        if (fragment.childNodes.length === 0) {
            this.chatsContainer.innerHTML = '<div class="no-results">Ничего не найдено</div>';
        } else {
            this.chatsContainer.appendChild(fragment);
        }
    }
    
    appendChatElement(fragment, chatData) {
        let chat_id, title, message_text, message_id, content_type, content_name;
    
        if (chatData.chat) {
            chat_id = chatData.chat.chat_id;
            title = chatData.chat.title;
            if (chatData.last_message) {
                message_text = chatData.last_message.message_text;
                message_id = chatData.last_message.message_id;
                content_type = chatData.last_message.content_type;
                content_name = chatData.last_message.content_name;
            } else if (chatData.message) {
                message_text = chatData.message.message_text;
                message_id = chatData.message.message_id;
                content_type = chatData.message.content_type;
                content_name = chatData.message.content_name;
            }
        } else {
            chat_id = chatData.chat_id;
            title = chatData.title;
            message_text = chatData.message_text;
            message_id = chatData.message_id;
            content_type = chatData.content_type;
            content_name = chatData.content_name;
        }
        
        const chat = new Chat(chat_id, title, message_text, message_id || content_name, content_type);
        const chatElement = chat.render();
        chatElement.addEventListener('click', this.clickOnChat.bind(this));
        
        fragment.appendChild(chatElement);
    }

    updateMessages(messages) {
        if (messages.length === 0) return;
    
        const fragment = document.createDocumentFragment();
        let currentDate = null;
    
        for (let i = messages.length - 1; i >= 0; i--) {
            const messageData = messages[i];
            const formattedDate = Utils.getFormattedDate(messageData.message.message_timestamp * 1000);

            if (formattedDate !== currentDate) {
                const dateHeader = document.createElement('div');
                dateHeader.className = 'date-header';
                dateHeader.textContent = formattedDate;
                fragment.insertBefore(dateHeader, fragment.firstChild);
                currentDate = formattedDate;
            }
    
            const message = Message.createFromData(messageData);
            this.currentLastMessageId = messages[0].message.message_id;
            fragment.insertBefore(message.render(), fragment.firstChild);
        }
    
        this.messagesContainer.appendChild(fragment);

        this.isLoading = false;
        this.currentPage++;
    }
    

    updateNewMessages(messages) {
        if (messages.length === 0) return;
    
        const fragment = document.createDocumentFragment();
        messages.forEach(messageData => {
            if (messages[0].message.message_id > this.currentLastMessageId && this.currentLastMessageId !== null) {
                this.currentLastMessageId = messages[0].message.message_id;
                const message = Message.createFromData(messageData);
                fragment.prepend(message.render());

                this.updateChatContainer(messageData);
            }
            
            this.messagesContainer.prepend(fragment);
            if (shouldScroll) {
                this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            }
        });
    }
    
    updateChatContainer(messageData) {
        const chatContainer = document.querySelector(`.chat[data-chat-id="${messageData.message.chat_id}"]`);
        if (chatContainer) {
            const chatMessageElement = chatContainer.querySelector('.chat-message');
            if (chatMessageElement) {
                chatMessageElement.textContent = messageData.message.message_text;
            }
        }
    }
    

    clickOnChat(event) {
        const chatElement = event.target.closest('.chat');
        
        if (chatElement) {
            const chatId = chatElement.getAttribute('data-chat-id');
            const messageId = chatElement.getAttribute('data-message-id');
            if (this.currentChatId !== chatId) {
                this.currentChatId = chatId;
                this.currentPage = 0;
                
                const chatTitle = chatElement.querySelector('.chat-name').textContent;
                
                const gradient = Utils.generateGradientFromId(chatId);
                this.chatsInfoContainer.innerHTML = `
                    <div class="chat">
                        <div class="chat-avatar" style="background: ${gradient};">${chatTitle.charAt(0).toUpperCase()}</div>
                        <div class="chat-item">
                            <div class="chat-name">${chatTitle}</div>
                        </div>
                    </div>
                    <div class="line"></div>
                `;
                
                if (window.innerWidth <= 768) {
                    this.chatsInfoContainer.style.display = 'none';
                    this.messagesContainer.style.display = 'flex';
                } else {
                    this.chatsInfoContainer.style.display = 'flex';
                    this.messagesContainer.style.display = 'flex';
                }
    
                this.messagesContainer.innerHTML = '';
                this.messagesContainer.setAttribute('style', 'height: calc(92vh + 8px); overflow: auto;');
    
                this.loadMessages();
                this.startPolling();
                Utils.smoothScrollByMessageId(`#${messageId}`, 500);
            }
        }
    }
    

    handleScroll() {
        if (this.lastResponseWasEmpty || this.isLoading) {
            return;
        }
        
        if (-this.messagesContainer.scrollTop + this.messagesContainer.clientHeight >= this.messagesContainer.scrollHeight - 600) {
            this.loadMessages();
        }
    }

    handleSearch(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const message = this.searchInput.value.trim();
            if (message) {
                this.loadSearch(message);
            }
        } else if (event.key === 'Escape') {
            event.preventDefault();
            this.socket.send(JSON.stringify({ action: 'chats'}));
        }
    }

    loadMessages() {
        this.isLoading = true;
        this.socket.send(JSON.stringify({ action: 'messages', chat_id: this.currentChatId, page: this.currentPage }));
    }

    loadSearch(message) {
        this.socket.send(JSON.stringify({ action: 'search_messages', message: message }));
        this.currentChatId = null;
        this.currentPage = 0;
        this.chatsContainer.innerHTML = '<div class="loading">Поиск...</div>';
    }

    startPolling() {
        clearInterval(this.pollingInterval);
        this.pollingInterval = setInterval(() => {
            if (this.currentChatId) {
                this.socket.send(JSON.stringify({ action: 'new_messages', chat_id: this.currentChatId, page: 0 }));
            }
        }, 15000);
    }

}


document.addEventListener('DOMContentLoaded', () => {
    const app = new ChatApp('wss://' + window.location.host + '/ws/chats/');
});