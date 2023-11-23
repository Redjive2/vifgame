let mouse = {x:0,y:0}
let contextMenuOpen = false

let topWindowZIndex = 0
let selectedWindow
let windowsActive = 0
let windowsFullscreen = 0

const realWindow = window

document.addEventListener('mousemove', (event) => {
    mouse.x = event.pageX
    mouse.y = event.pageY
})

document.addEventListener('contextmenu', (event) => {
    event.preventDefault()
})

function displayContextMenu(buttons) {
    contextMenuOpen = true
    doge('contextMenu').style.display = 'unset'
    doge('contextMenu').style.opacity = 1
    doge('contextMenu').style.left = mouse.x + 'px'
    doge('contextMenu').style.top = mouse.y + 'px'

    doge('contextMenu').innerHTML = ''
    for(const button in buttons) {
        const div = document.createElement('div')
        div.innerText = buttons[button].text
        div.onclick = () => {buttons[button].function()}
        doge('contextMenu').appendChild(div)
    }

    if((doge('contextMenu').offsetWidth + doge('contextMenu').getBoundingClientRect().left) > window.innerWidth) {
        doge('contextMenu').style.left = mouse.x - doge('contextMenu').offsetWidth + 'px'
    }
    if((doge('contextMenu').offsetHeight + doge('contextMenu').getBoundingClientRect().top) > window.innerHeight) {
        doge('contextMenu').style.top = mouse.y - doge('contextMenu').offsetHeight + 'px'
    }
}

document.addEventListener('mouseup', (e) => {
    if(contextMenuOpen && e.button !== 2) {
        setTimeout(() => {
            doge('contextMenu').style.opacity = 0
            setTimeout(() => {
                doge('contextMenu').style.display = 'none'
            }, 100);
            contextMenuOpen = false
        }, 50);
    }
})

function openWindowFromObject(object, run) {
    console.log(object)
    if(typeof object.open === 'string') {
        if(run) {
            createWindow(object.name, object.size[0], object.size[1], object.open, object.color, object, object.canOpen, run)
        } else {
            createWindow(object.name, object.size[0], object.size[1], object.open, object.color, object, object.canOpen)
        }
    } else {
        object.open()
    }
}

function createWindow(title, width, height, content, titleColor, icon, canOpen, run) {
    const window = document.createElement('div')
    topWindowZIndex++
    window.style.zIndex = topWindowZIndex
    window.classList.add('window')
    window.style.width = width + 'px'
    window.style.height = height + 'px'
    window.style.setProperty('--windowTitleColor', titleColor)

    setInterval(() => {
        if(data.settings.togglable.windowTransparency) {
            window.style.backgroundColor = 'transparent'
        } else {
            window.style.backgroundColor = 'rgb(30, 30, 30)'
        }
    }, 100);

    let windowContent
    if(content.startsWith('https://')) {
        windowContent = `<iframe src="${content}">`
    } else {
        windowContent = content
    }

    if(!canOpen) {
        window.innerHTML = `
        <div class="windowTitle">
            <div>
                <span>${title}</span>
            </div>
            <div class="windowButtons">
                <div class="windowMinimize" title="Minimize window...">
                    <img src="media/glyphs/minimize.png">
                </div>
                <div class="windowFullscreen" title="Toggle fullscreen...">
                    <img src="media/glyphs/fullscreen.png">
                </div>
                <div class="windowClose" title="Close window...">
                    <img src="media/glyphs/close.png">
                </div>
            </div>
        </div>
        <div class="windowContent">
            ${windowContent}
            <span style="position: absolute;">LOADING...</span>
        </div>
        `
    } else {
        window.innerHTML = `
        <div class="windowTitle">
            <div>
                <span>${title}</span>
            </div>
            <div class="windowButtons" title="Open window in new tab...">
                <div class="windowOpen">
                    <img src="media/glyphs/open.png">
                </div>
                <div class="windowMinimize" title="Minimize window...">
                    <img src="media/glyphs/minimize.png">
                </div>
                <div class="windowFullscreen" title="Toggle fullscreen...">
                    <img src="media/glyphs/fullscreen.png">
                </div>
                <div class="windowClose" title="Close window...">
                    <img src="media/glyphs/close.png">
                </div>
            </div>
        </div>
        <div class="windowContent">
            ${windowContent}
            <span style="position: absolute;">LOADING...</span>
        </div>
        `
    }

    const windowTitle = window.querySelector('.windowTitle')
    let windowMoveInterval
    let windowClicked = {x:0,y:0}
    let pos = {x:0,y:0}
    let size = {x:0,y:0}
    let windowFullscreen = false
    let windowMoving = false
    let windowMinimized = false

    const taskbarIcon = document.createElement('img')
    taskbarIcon.onclick = () => {
        minimizeWindow()
    }
    taskbarIcon.classList.add('taskbarApp')
    taskbarIcon.style.scale = 0.9
    taskbarIcon.style.opacity = 0.5
    taskbarIcon.src = `media/apps/${icon}.png`
    taskbarIcon.setAttribute('title', title)
    doge('taskBarLeft').appendChild(taskbarIcon)

    taskbarIcon.addEventListener('mouseup', (e) => {
        if(e.button === 2) {
            displayContextMenu([
                {
                    text: 'Close window',
                    function: () => {closeWindow()}
                },
                {
                    text: 'Pin to taskbar',
                    function: () => {
                        if(!data.user.taskbar.includes(icon)) {
                            pinToTaskbar(icon)
                            data.user.taskbar.push(icon)
                            save()
                        }
                    }
                }
            ])
        }
    })





    windowTitle.addEventListener('mousedown', (event) => {
        if(event.button === 0) {
            windowClicked.x = event.clientX - window.getBoundingClientRect().left
            windowClicked.y = event.clientY - window.getBoundingClientRect().top
            if(!windowFullscreen && !windowMoving) {
                windowMoving = true
                window.querySelector('.windowContent').style.pointerEvents = 'none'
                windowMoveInterval = setInterval(() => {
                    if(data.settings.togglable.windowPosLimits) {
                        if(mouse.x - windowClicked.x > 0 && mouse.x - windowClicked.x < realWindow.innerWidth - window.offsetWidth) {
                            window.style.left = mouse.x - windowClicked.x + 'px'
                        } else if(mouse.x - windowClicked.x < 0) {
                            window.style.left = '0px';
                        } else if(mouse.x - windowClicked.x > realWindow.innerWidth - window.offsetWidth) {
                            window.style.left = realWindow.innerWidth - window.offsetWidth + 'px'
                        }
                        if(mouse.y - windowClicked.y > 0 && mouse.y - windowClicked.y < realWindow.innerHeight - window.offsetHeight) {
                            window.style.top = mouse.y - windowClicked.y + 'px'
                        } else if(mouse.y - windowClicked.y < 0) {
                            window.style.top = '0px'
                        } else if(mouse.y - windowClicked.y > realWindow.innerHeight - window.offsetHeight) {
                            window.style.top = realWindow.innerHeight - window.offsetHeight + 'px'
                        }
                    } else {
                        window.style.left = mouse.x - windowClicked.x + 'px'
                        window.style.top = mouse.y - windowClicked.y + 'px'
                    }

                    if(!windowFullscreen) {
                        pos.x = window.style.left
                        pos.y = window.style.top
                    }
                    window.style.transition = 'scale ease-in 0.1s, opacity ease-in 0.1s, width ease-in-out 0.25s, height ease-in-out 0.25s'
                }, 10);
            }
        }
    });

    window.addEventListener('mousedown', (event) => {
        topWindowZIndex++
        window.style.zIndex = topWindowZIndex
        selectedWindow = window

        if(event.offsetX > window.offsetWidth - 20 && event.offsetY > window.offsetHeight - 20) {
            window.style.transition = 'none'
        }
    })

    window.addEventListener('mouseup', () => {
        clearInterval(windowMoveInterval)
        windowMoving = false
        window.querySelector('.windowContent').style.pointerEvents = 'all'

        window.style.transition = 'scale ease-in 0.1s, opacity ease-in 0.1s, width ease-in-out 0.25s, height ease-in-out 0.25s, top ease-in-out 0.25s, left ease-in-out 0.25s'
        if(pos.x + window.offsetWidth > realWindow.innerWidth) {
            window.style.width = realWindow.innerWidth + 'px'
        }
        if(!windowFullscreen) {
            size.x = window.offsetWidth
            size.y = window.offsetHeight
        }
    })

    window.querySelector('.windowTitle').addEventListener('mouseup', (e) => {
        if(e.button === 2) {
            displayContextMenu([
                {
                    text: 'Close window',
                    function: () => {closeWindow()}
                },
                {
                    text: 'Close all windows',
                    function: () => {
                        let i = 0;
                        doge('desktop').querySelectorAll('.window').forEach(window => {
                            setTimeout(() => {
                                window.style.scale = '90%'
                                window.style.opacity = '0'
                                if(windowFullscreen) {
                                    windowsFullscreen--
                                    updateTaskbar()
                                }
                                setTimeout(() => {
                                    window.remove()
                                    windowsActive--
                                }, 100);
                            }, 10 * i);
                            i++
                        })
                        doge('taskBarLeft').querySelectorAll('.taskbarApp').forEach(app => {
                            setTimeout(() => {
                                app.remove()
                            }, 10 * i);
                        })
                    }
                },
                {
                    text: 'Toggle fullscreen',
                    function: () => {toggleFullscreen()}
                },
                {
                    text: 'Reset window position',
                    function: () => {
                        window.style.top = 0
                        window.style.left = 0
                        window.style.width = width + 'px'
                        window.style.height = height + 'px'
                    }
                },
                {
                    text: 'DESTROY window',
                    function: () => {
                        closeWindow()
                        DeBread.shake()
                        DeBread.shake(doge('desktop'), 10, 10, 10, 175, true, 2)
                        DeBread.createParticles(doge('desktop'),
                            100,
                            0,
                            2500,
                            'cubic-bezier(0,1,.5,1)',
                            [
                                [window.getBoundingClientRect().left + window.offsetWidth / 2, window.getBoundingClientRect().left + window.offsetWidth / 2],
                                [window.getBoundingClientRect().top + window.offsetHeight / 2, window.getBoundingClientRect().top + window.offsetHeight / 2],
                            ],
                            [[[50, 50], [50, 50]], [[0, 0], [0, 0]]],
                            [[0, 90], [-90, 180]],
                            [[-1000, 1000], [-1000, 1000]],
                            [[255, 0, 0], [255, 100, 0]],
                            [[200, 0, 0], [200, 50, 0]]
                        )
                    }
                },
            ])
        }
    })

    window.querySelector('.windowClose').onclick = closeWindow
    window.querySelector('.windowFullscreen').onclick = toggleFullscreen
    window.querySelector('.windowMinimize').onclick = minimizeWindow

    if(canOpen) {
        window.querySelector('.windowOpen').onclick = () => {realWindow.open(content)}
    }

    function toggleFullscreen() {
        if(!windowFullscreen) {
            window.style.top = '0'
            window.style.left = '0'
            window.style.width = '100vw'
            window.style.height = 'calc(100vh - 57px)'
            window.style.resize = 'none'
            window.style.borderRadius = 0
            windowsFullscreen++

            window.querySelector('.windowFullscreen').querySelector('img').src = 'media/glyphs/window.png'
        } else {
            window.style.width = size.x + 'px'
            window.style.height = size.y + 'px'
            window.style.top = pos.y
            window.style.left = pos.x
            window.style.resize = 'both'
            window.style.borderRadius = '5px'
            windowsFullscreen--

            window.querySelector('.windowFullscreen').querySelector('img').src = 'media/glyphs/fullscreen.png'
        }
        updateTaskbar()
        windowFullscreen = !windowFullscreen
    }

    function closeWindow() {
        window.style.scale = '90%'
        window.style.opacity = '0'
        taskbarIcon.remove()
        if(windowFullscreen) {
            windowsFullscreen--
            updateTaskbar()
        }
        setTimeout(() => {
            window.remove()

            windowsActive--
        }, 100);
    }

    function minimizeWindow() {
        if(windowMinimized) {
            window.style.opacity = 1
            window.style.pointerEvents = 'unset'
            window.style.scale = 1

            taskbarIcon.style.scale = 0.9
            taskbarIcon.style.opacity = 0.5

            windowMinimized = false
        } else {
            window.style.opacity = 0
            window.style.pointerEvents = 'none'
            window.style.scale = 0

            taskbarIcon.style.scale = 1
            taskbarIcon.style.opacity = 1

            windowMinimized = true
        }
    }

    window.style.left = 10 * windowsActive + 'px'
    window.style.top = 10 * windowsActive + 'px'
    doge('desktop').appendChild(window)
    windowsActive++
    setTimeout(() => {
        window.style.animation = 'none'
    }, 100);

    setTimeout(() => {
        const iframe = window.querySelector('iframe').contentWindow
        console.log(typeof iframe[run])
        if(typeof iframe.run === 'function') {
            iframe.contentDocument.run()
        }
    }, 1000);
}

function openApp(app) {
    if(typeof apps[app].open === 'string') {
        createWindow(apps[app].name, apps[app].size[0], apps[app].size[1], apps[app].open, apps[app].color, app, apps[app].canOpen)
    } else {
        apps[app].open()
    }
}

function createNoti(img, altImg, appName, title, desc, event) {
    let notiActive = true
    const div = document.createElement('div')
    div.classList.add('noti')
    div.innerHTML = `
    <div class="notiImgContainer" style="background-color: ${data.settings.accentColor};">
        <img src="${img}">
        <img src="${altImg}">
        <span>${appName}</span>
    </div>
    <div class="notiText">
        <span class="notiTitle">${title}</span><br>
        <span class="notiDesc">${desc}</span>
    </div>
    `
    doge('notiContainer').appendChild(div)

    div.onclick = () => {
        if(event) {event()}
        if(notiActive) {
            notiActive = false
            div.style.opacity = 0
            div.style.height = 0
            div.style.padding = '0px 5px'
            div.style.marginTop = 0
            setTimeout(() => {
                doge('notiContainer').removeChild(div)
            }, 500);
        }
    }

    setTimeout(() => {
        div.style.width = '300px'
        div.style.gap = '5px'
        div.querySelector('.notiText').style.width = '225px'
        setTimeout(() => {
            div.querySelector('.notiText').style.opacity = 1
        }, 500);
    }, 1000);

    setTimeout(() => {
        if(notiActive) {
            notiActive = false
            div.style.opacity = 0
            div.style.height = 0
            div.style.padding = '0px 5px'
            div.style.marginTop = 0
            setTimeout(() => {
                doge('notiContainer').removeChild(div)
            }, 500);
        }
    }, 7500);
}

let appGalleryOpen = false
const appGallery = doge('appGallery')
function openAppGallery() {
    if(!appGalleryOpen) {
        doge('desktop').style.scale = '110%'
        doge('taskBar').style.transform = 'translateY(100px)'

        appGallery.style.display = 'flex'
        appGallery.style.opacity = 1
        appGallery.style.pointerEvents = 'unset'
        updateAppGallery()
    } else {
        doge('desktop').style.scale = 1
        doge('taskBar').style.transform = 'none'
        appGallery.style.opacity = 0
        appGallery.style.pointerEvents = 'none'
    }
    appGalleryOpen = !appGalleryOpen
}

document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && appGalleryOpen) {
        openAppGallery()
    }
})

const innerAppGallery = doge('innerAppGallery')
function updateAppGallery() {
    innerAppGallery.innerHTML = ''

    for (const app in apps) {
        const div = document.createElement('div')
        div.classList.add('app')
        div.innerHTML = `
        <img src="media/apps/${app}.png">
        <span>${apps[app].name}</span>
        `
        div.title = `Open ${apps[app].name}...`
        innerAppGallery.appendChild(div)

        div.onclick = () => {
            if(typeof apps[app].open === 'string') {
                createWindow(
                    apps[app].name,
                    apps[app].size[0],
                    apps[app].size[1],
                    apps[app].open,
                    apps[app].color,
                    app,
                    apps[app].canOpen)
            } else {
                apps[app].open()
            }
            openAppGallery()
        }
    }
}

function renderTaskbar() {
    doge('taskBarMain').innerHTML = ''
    for(const app in data.user.taskbar) {
        pinToTaskbar(data.user.taskbar[app])
    }
}
renderTaskbar()

function pinToTaskbar(app) {
    const img = document.createElement('img')
    img.src = `media/apps/${app}.png`
    img.onclick = () => {openApp(app)}
    img.addEventListener('mouseup', (e) => {
        if(e.button === 2) {
            displayContextMenu(
                [{
                    text: 'Remove from taskbar',
                    function: () => {
                        img.remove()
                        data.user.taskbar.splice(data.user.taskbar.indexOf(app), 1)
                        save()
                    }
                }]
            )
        }
    })
    doge('taskBarMain').appendChild(img)
}
