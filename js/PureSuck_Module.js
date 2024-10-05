

    function enhanceContent() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            const isInPostMediaOrHeader = img.closest('.post-media') || img.closest('header');
            if (isInPostMediaOrHeader) return;
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }
            if (!img.hasAttribute('data-zoomable')) {
                img.dataset.zoomable = 'true';
            }
        });

        const headers = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
        headers.forEach(header => {
            const elements = document.querySelectorAll(header);
            elements.forEach((element, index) => {
                if (element.closest('.post-media')) return;
                let headerText = element.textContent.trim().toLowerCase().replace(/\W+/g, '-');
                headerText = headerText.substring(0, 50);
                const id = `heading-${header}-${index + 1}-${headerText}`;
                if (!element.hasAttribute('id')) {
                    element.setAttribute('id', id);
                }
            });
        });
    }

    function handleGoTopButton() {
        const goTopBtn = document.getElementById('go-top');
        const goTopAnchor = document.querySelector('#go-top .go');

        let ticking = false;
        window.addEventListener('scroll', function () {
            if (!ticking) {
                window.requestAnimationFrame(function () {
                    const st = document.documentElement.scrollTop || document.body.scrollTop;
                    if (st > 0) {
                        if (document.getElementById('main-container')) {
                            const w = window.innerWidth;
                            const mw = document.getElementById('main-container').offsetWidth;
                            if ((w - mw) / 2 > 70) {
                                goTopBtn.style.left = 'unset';
                                goTopBtn.style.right = `calc((100% - ${mw}px) / 2 - 80px)`;
                            } else {
                                goTopBtn.style.left = 'unset';
                                goTopBtn.style.right = '10px';
                            }
                        }
                        goTopBtn.style.display = 'block';
                    } else {
                        goTopBtn.style.display = 'none';
                    }
                    ticking = false;
                });
                ticking = true;
            }
        });

        goTopAnchor.addEventListener('click', function (e) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    function generateTOC() {
        const tocSection = document.getElementById("toc-section");
        const toc = document.querySelector(".toc");
        const postWrapper = document.querySelector(".inner-post-wrapper");
    
        // 检查是否存在必要的元素
        if (!toc || !postWrapper) return;
    
        const elements = postWrapper.querySelectorAll("h1, h2, h3, h4, h5, h6");
        if (!elements.length) return;
    
        let str = `<div class="dir">\n<ul id="toc">`;
        elements.forEach((v, index) => {
            if (!v.id) {
                v.id = `heading-${index}`; // 如果没有 ID，则分配一个唯一的 ID
            }
            str += `<li class="li li-${v.tagName[1]}"><a href="#${v.id}" id="link-${v.id}" class="toc-a">${v.textContent}</a></li>\n`;
        });
        str += `</ul>\n<div class="sider"><span class="siderbar"></span></div>\n</div>`;
    
        toc.insertAdjacentHTML("beforeend", str);
    
        elements.forEach(v => {
            const btn = document.querySelector(`#link-${v.id}`);
            if (!btn) return; // 如果按钮不存在，跳过该元素
            btn.addEventListener("click", event => {
                event.preventDefault();
                const targetTop = getElementTop(v);
                window.scrollTo({
                    top: targetTop,
                    behavior: "smooth"
                });
                history.pushState(null, null, `#${v.id}`);
            });
        });
    
        let ticking = false;
        window.addEventListener("scroll", () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const currentPosition = window.scrollY;
                    elements.forEach((element, index) => {
                        const targetTop = getElementTop(element);
                        const nextElement = elements[index + 1];
                        const nextTargetTop = nextElement ? getElementTop(nextElement) : Number.MAX_SAFE_INTEGER;
    
                        if (currentPosition >= targetTop && currentPosition < nextTargetTop) {
                            removeClass(elements);
                            const anchor = document.querySelector(`#link-${element.id}`);
                            if (anchor) {
                                anchor.classList.add("li-active");
    
                                const tocItems = document.querySelectorAll(".toc li");
                                let sidebarTop = tocItems[index].getBoundingClientRect().top + window.scrollY;
                                sidebarTop -= toc.getBoundingClientRect().top + window.scrollY;
    
                                const fontSize = parseFloat(getComputedStyle(tocItems[index]).fontSize);
                                const offset = fontSize / 2;
                                sidebarTop += offset - 3;
    
                                document.querySelector(".siderbar").style.transform = `translateY(${sidebarTop}px)`;
                            }
                        }
                    });
                    ticking = false;
                });
                ticking = true;
            }
        });
    
        if (tocSection) {
            tocSection.style.display = "block";
            const rightSidebar = document.querySelector(".right-sidebar");
            if (rightSidebar) {
                rightSidebar.style.position = "absolute";
                rightSidebar.style.top = "0";
            }
        }
    }
    
    function getElementTop(element) {
        let actualTop = element.offsetTop;
        let current = element.offsetParent;
    
        while (current !== null) {
            actualTop += current.offsetTop;
            current = current.offsetParent;
        }
    
        return actualTop;
    }
    
    function removeClass(elements) {
        elements.forEach(v => {
            const anchor = document.querySelector(`#link-${v.id}`);
            if (anchor) { // 检查 anchor 是否存在
                anchor.classList.remove("li-active");
            }
        });
    }
    

    function parseShortcodes() {
        const elements = document.querySelectorAll('.inner-post-wrapper');

        elements.forEach(element => {
            let content = element.innerHTML;

            content = content.replace(/\[\/(alert|window|friend-card|collapsible-panel|timeline|tabs)\](<br\s*\/?>)?/g, '[/$1]');
            content = content.replace(/\[\/timeline-event\](<br\s*\/?>)?/g, '[/timeline-event]');
            content = content.replace(/\[\/tab\](<br\s*\/?>)?/g, '[/tab]');

            const alertRegex = /\[alert type="([^"]*)"\](.*?)\[\/alert\]/g;
            content = content.replace(alertRegex, (match, type, text) => {
                return `<div alert-type="${type}">${text}</div>`;
            });

            const windowRegex = /\[window type="([^"]*)" title="([^"]*)"\](.*?)\[\/window\]/g;
            content = content.replace(windowRegex, (match, type, title, text) => {
                if (text.startsWith('<br')) {
                    text = text.replace(/^<br\s*\/?>/, '');
                }
                return `<div window-type="${type}" title="${title}">${text}</div>`;
            });

            const friendCardRegex = /\[friend-card name="([^"]*)" ico="([^"]*)" url="([^"]*)"\](.*?)\[\/friend-card\]/g;
            content = content.replace(friendCardRegex, (match, name, ico, url, description) => {
                return `<div friend-name="${name}" ico="${ico}" url="${url}">${description}</div>`;
            });

            const collapsiblePanelRegex = /\[collapsible-panel title="([^"]*)"\](.*?)\[\/collapsible-panel\]/g;
            
            content = content.replace(collapsiblePanelRegex, (match, title, text) => {
                if (text.startsWith('<br')) {
                    text = text.replace(/^<br\s*\/?>/, '');
                }
                return `<div collapsible-panel title="${title}">${text}</div>`;
            });

            const timelineRegex = /\[timeline\](.*?)\[\/timeline\]/gs;
            content = content.replace(timelineRegex, (match, innerContent) => {
                const timelineEventRegex = /\[timeline-event date="([^"]*)" title="([^"]*)"\](.*?)\[\/timeline-event\]/gs;
                let eventsContent = innerContent.replace(timelineEventRegex, (eventMatch, date, title, eventText) => {
                    return `<div timeline-event date="${date}" title="${title}">${eventText}</div>`;
                });
                return `<div id="timeline">${eventsContent}</div>`;
            });

            const tabsRegex = /\[tabs\](.*?)\[\/tabs\]/gs;
            content = content.replace(tabsRegex, (match, innerContent) => {
                const tabRegex = /\[tab title="([^"]*)"\](.*?)\[\/tab\]/gs;
                let tabsContent = innerContent.replace(tabRegex, (tabMatch, title, tabContent) => {
                    tabContent = tabContent.replace(/^\s*<br\s*\/?>/, '');
                    return `<div tab-title="${title}">${tabContent}</div>`;
                });
                return `<div tabs>${tabsContent}</div>`;
            });

            element.innerHTML = content;
        });
    }

    function parseAlerts() {
        const elements = document.querySelectorAll('[alert-type]');

        elements.forEach(element => {
            const type = element.getAttribute('alert-type');
            const content = element.innerHTML;

            let iconClass;
            switch (type) {
                case 'green':
                    iconClass = 'icon-ok-circle';
                    break;
                case 'blue':
                    iconClass = 'icon-info-circled';
                    break;
                case 'yellow':
                    iconClass = 'icon-attention';
                    break;
                case 'red':
                    iconClass = 'icon-cancel-circle';
                    break;
                default:
                    iconClass = 'icon-info-circled';
            }

            const newContent = `
                <div role="alert" class="alert-box ${type}">
                    <i class="${iconClass}"></i>
                    <p class="text-xs font-semibold">${content}</p>
                </div>
            `;

            element.outerHTML = newContent;
        });
    }

    function parseWindows() {
        const elements = document.querySelectorAll('[window-type]');

        elements.forEach(element => {
            const type = element.getAttribute('window-type');
            const title = element.getAttribute('title');
            const content = element.innerHTML;

            const newContent = `
            <div class="notifications-container">
                <div class="window ${type}">
                    <div class="flex">
                        <div class="window-prompt-wrap">
                            <p class="window-prompt-heading">${title}</p>
                            <div class="window-prompt-prompt">
                                <p>${content}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            `;

            element.outerHTML = newContent;
        });
    }

    function parseFriendCards() {
        const container = document.body;

        function identifyGroups(node, groups = [], currentGroup = null) {
            while (node) {
                if (node.nodeType === Node.ELEMENT_NODE && node.hasAttribute('friend-name')) {
                    if (!currentGroup) {
                        currentGroup = [];
                        groups.push(currentGroup);
                    }
                    currentGroup.push(node);
                } else if (node.nodeType === Node.ELEMENT_NODE ||
                    (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '')) {
                    currentGroup = null;
                }

                if (node.firstChild) {
                    identifyGroups(node.firstChild, groups, currentGroup);
                }

                node = node.nextSibling;
            }
            return groups;
        }

        function replaceGroups(groups) {
            groups.forEach(group => {
                if (group.length > 0) {
                    const friendsBoardList = document.createElement('div');
                    friendsBoardList.classList.add('friendsboard-list');

                    group.forEach(node => {
                        const friendName = node.getAttribute('friend-name');
                        const avatarUrl = node.getAttribute('ico');
                        const url = node.getAttribute('url');

                        const newContent = document.createElement('a');
                        newContent.href = url;
                        newContent.classList.add('friendsboard-item');
                        newContent.target = "_blank";
                        newContent.innerHTML = `
                            <div class="friends-card-header">
                                <span class="friends-card-username">${friendName}</span>
                                <span class="friends-card-dot"></span>
                            </div>
                            <div class="friends-card-body">
                                <div class="friends-card-text">
                                    ${node.innerHTML}
                                </div>
                                <div class="friends-card-avatar-container">
                                    <img src="${avatarUrl}" alt="Avatar" class="friends-card-avatar">
                                </div>
                            </div>
                        `;

                        friendsBoardList.appendChild(newContent);
                    });

                    group[0].innerHTML = '';
                    group[0].appendChild(friendsBoardList);

                    for (let i = 1; i < group.length; i++) {
                        group[i].parentNode.removeChild(group[i]);
                    }
                }
            });
        }

        const groups = identifyGroups(container.firstChild);
        replaceGroups(groups);
    }

    function parseCollapsiblePanels() {
        const elements = document.querySelectorAll('[collapsible-panel]');

        elements.forEach(element => {
            const title = element.getAttribute('title');
            const content = element.innerHTML;

            const newContent = `<div class="collapsible-panel">
            <button class="collapsible-header">
                ${title}
                <span class="icon icon-down-open"></span>
            </button>
            <div class="collapsible-content">
                <div class="collapsible-details">${content}</div>
            </div>
        </div>`;

            element.outerHTML = newContent;
        });

        document.querySelectorAll('.collapsible-header').forEach(button => {
            button.addEventListener('click', function () {
                this.classList.toggle('active');
                const content = this.nextElementSibling;
                const icon = this.querySelector('.icon');
                if (content.style.maxHeight) {
                    content.style.maxHeight = null;
                    icon.classList.remove('icon-up-open');
                    icon.classList.add('icon-down-open');
                } else {
                    content.style.maxHeight = content.scrollHeight + "px";
                    icon.classList.remove('icon-down-open');
                    icon.classList.add('icon-up-open');
                }
            });
        });
    }

    function parseTimeline() {
        const timelineEvents = document.querySelectorAll('[timeline-event]');

        timelineEvents.forEach(event => {
            const date = event.getAttribute('date');
            const title = event.getAttribute('title');
            const content = event.innerHTML;

            const timelineItem = document.createElement('div');
            timelineItem.classList.add('timeline-item');

            timelineItem.innerHTML = `
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                    <div class="timeline-date">${date}</div>
                    <p class="timeline-title">${title}</p>
                    <p class="timeline-description">${content}</p>
                </div>
            `;

            event.replaceWith(timelineItem);
        });
    }

    function parseTabs() {
        const tabContainers = document.querySelectorAll('[tabs]');
    
        tabContainers.forEach((container, containerIndex) => {
            const tabElements = Array.from(container.children);
            const tabTitles = [];
            const tabContents = [];
    
            tabElements.forEach((child, index) => {
                const title = child.getAttribute('tab-title');
                if (title) {
                    tabTitles.push(title);
                    tabContents.push(child.cloneNode(true));
                }
            });
    
            if (tabTitles.length === 0) return;
    
            const tabHeaderHTML = tabTitles.map((title, index) => `
                <div class="tab-link ${index === 0 ? 'active' : ''}" 
                     data-tab="tab${containerIndex + 1}-${index + 1}" 
                     role="tab" 
                     aria-controls="tab${containerIndex + 1}-${index + 1}" 
                     tabindex="${index === 0 ? '0' : '-1'}">
                    ${title}
                </div>
            `).join('');
    
            const tabContentHTML = tabContents.map((content, index) => {
                const tabPane = document.createElement('div');
                tabPane.className = `tab-pane ${index === 0 ? 'active' : ''}`;
                tabPane.id = `tab${containerIndex + 1}-${index + 1}`;
                tabPane.setAttribute('role', 'tabpanel');
                tabPane.setAttribute('aria-labelledby', `tab${containerIndex + 1}-${index + 1}`);
                tabPane.appendChild(content);
                return tabPane.outerHTML;
            }).join('');
    
            const tabContainer = document.createElement('div');
            tabContainer.className = 'tab-container';
            tabContainer.innerHTML = `
                <div class="tab-header-wrapper">
                    <button class="scroll-button left" aria-label="向左"></button>
                    <div class="tab-header" role="tablist">
                        ${tabHeaderHTML}
                        <div class="tab-indicator"></div>
                    </div>
                    <button class="scroll-button right" aria-label="向右"></button>
                </div>
                <div class="tab-content">
                    ${tabContentHTML}
                </div>
            `;
    
            const fragment = document.createDocumentFragment();
            fragment.appendChild(tabContainer);
    
            container.innerHTML = '';
            container.appendChild(fragment);
    
            const activeLink = tabContainer.querySelector('.tab-link.active');
            const indicator = tabContainer.querySelector('.tab-indicator');
            if (activeLink && indicator) {
                indicator.style.width = `${activeLink.offsetWidth * 0.75}px`;
                indicator.style.left = `${activeLink.offsetLeft + (activeLink.offsetWidth * 0.125)}px`;
            }
    
            const tabHeaderElement = tabContainer.querySelector('.tab-header');
            const leftButton = tabContainer.querySelector('.scroll-button.left');
            const rightButton = tabContainer.querySelector('.scroll-button.right');
    
            // 检查是否需要显示滚动按钮
            const checkScrollButtons = () => {
                const totalWidth = Array.from(tabHeaderElement.children)
                    .reduce((acc, child) => acc + child.offsetWidth, 0);
                const containerWidth = tabHeaderElement.offsetWidth;
    
                if (totalWidth <= containerWidth) {
                    leftButton.style.display = 'none';
                    rightButton.style.display = 'none';
                } else {
                    leftButton.style.display = 'block';
                    rightButton.style.display = 'block';
                }
            };
    
            checkScrollButtons();
            window.addEventListener('resize', checkScrollButtons);
    
            leftButton.addEventListener('click', () => {
                tabHeaderElement.scrollBy({ left: -100, behavior: 'smooth' });
            });
    
            rightButton.addEventListener('click', () => {
                tabHeaderElement.scrollBy({ left: 100, behavior: 'smooth' });
            });
    
            let isDown = false;
            let startX;
            let scrollLeft;
    
            tabHeaderElement.addEventListener('mousedown', (e) => {
                isDown = true;
                startX = e.pageX - tabHeaderElement.offsetLeft;
                scrollLeft = tabHeaderElement.scrollLeft;
            });
    
            tabHeaderElement.addEventListener('mouseleave', () => {
                isDown = false;
            });
    
            tabHeaderElement.addEventListener('mouseup', () => {
                isDown = false;
            });
    
            tabHeaderElement.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - tabHeaderElement.offsetLeft;
                const walk = (x - startX) * 2; //scroll-fast
                tabHeaderElement.scrollLeft = scrollLeft - walk;
            });
    
            tabHeaderElement.addEventListener('touchstart', (e) => {
                isDown = true;
                startX = e.touches[0].pageX - tabHeaderElement.offsetLeft;
                scrollLeft = tabHeaderElement.scrollLeft;
            }, { passive: true }); // 标记为被动监听器
    
            tabHeaderElement.addEventListener('touchend', () => {
                isDown = false;
            });
    
            tabHeaderElement.addEventListener('touchmove', (e) => {
                if (!isDown) return;
                const x = e.touches[0].pageX - tabHeaderElement.offsetLeft;
                const walk = (x - startX) * 2; //scroll-fast
                tabHeaderElement.scrollLeft = scrollLeft - walk;
            }, { passive: true }); // 标记为被动监听器
    
            container.querySelector('.tab-header').addEventListener('click', function (event) {
                if (event.target.classList.contains('tab-link')) {
                    const tabLinks = this.querySelectorAll('.tab-link');
                    const tabPanes = tabContainer.querySelectorAll('.tab-pane');
                    const indicator = this.querySelector('.tab-indicator');
    
                    let currentIndex = Array.from(tabLinks).indexOf(event.target);
                    let previousIndex = Array.from(tabLinks).findIndex(link => link.classList.contains('active'));
    
                    tabLinks.forEach(link => link.classList.remove('active'));
                    tabPanes.forEach(pane => {
                        pane.classList.remove('active');
                        pane.removeAttribute('data-aos');
                        pane.classList.remove('aos-animate');
                    });
    
                    event.target.classList.add('active');
                    const activePane = document.getElementById(event.target.getAttribute('data-tab'));
                    activePane.classList.add('active');
    
                    if (currentIndex > previousIndex) {
                        activePane.setAttribute('data-aos', 'fade-left');
                    } else {
                        activePane.setAttribute('data-aos', 'fade-right');
                    }
    
                    indicator.style.width = `${event.target.offsetWidth * 0.75}px`;
                    indicator.style.left = `${event.target.offsetLeft + (event.target.offsetWidth * 0.125)}px`;
    
                    setTimeout(() => {
                        activePane.classList.add('aos-animate');
                    }, 0);
    
                    if (typeof AOS !== 'undefined') {
                        AOS.refresh(); // 重新初始化 AOS 动画
                    }
    
                    tabLinks.forEach(link => link.setAttribute('tabindex', '-1'));
                    event.target.setAttribute('tabindex', '0');
                    event.target.focus();
                }
    
                // 使点击的标签出现在视野内
                const tabHeaderRect = tabHeaderElement.getBoundingClientRect();
                const targetRect = event.target.getBoundingClientRect();
                if (targetRect.left < tabHeaderRect.left) {
                    tabHeaderElement.scrollBy({ left: targetRect.left - tabHeaderRect.left, behavior: 'smooth' });
                } else if (targetRect.right > tabHeaderRect.right) {
                    tabHeaderElement.scrollBy({ left: targetRect.right - tabHeaderRect.right, behavior: 'smooth' });
                }
            });
        });
    }
    
function runShortcodes(){
    parseShortcodes();
    enhanceContent();
    parseAlerts();
    parseWindows();
    parseFriendCards();
    parseCollapsiblePanels();
    parseTimeline();
    parseTabs();
    handleGoTopButton();
    generateTOC();

    mediumZoom('[data-zoomable]', {
        background: 'var(--card-color)'
    });
}
    
document.addEventListener('DOMContentLoaded', function () {
    runShortcodes()
});