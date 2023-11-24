const Desktop = module(() => {
    const {
        select,
        interval, timeout,
        type, exists,
        doc,
        apply
    } = require(Mod)

    const { data, save } = require(Core) // fake module: represents script.js

    const mouse = { x: 0, y:0 },
        realWindow = window

    let contextMenuOpen = false,
        topWindowZIndex = 0,
        selectedWindow,
        windowsActive = 0,
        windowsFullscreen = 0

    doc.onmousemove = ({ pageX, pageY }) => {
        mouse.x = pageX
        mouse.y = pageY
    }

    doc.oncontextmenu = ({ preventDefault }) => preventDefault()

    @Export function displayContextMenu(buttons) {
        contextMenuOpen = true
        const ctx = select `#contextMenu`

        apply(ctx.style, {
            display: 'unset',
            opacity: 1,
            left: mouse.x + 'px',
            top: mouse.y + 'px',
        })

        ctx.innerHTML = ''
        for (const key in buttons) {
            const button = buttons[key]
            const div = <jsx>
                <div on:click={button.function}>
                    ${button.text}
                </div>
            </jsx>

            ctx.append(div)
        }

        if ((ctx.offsetWidth + ctx.getBoundingClientRect().left) > window.innerWidth) {
            ctx.style.left = mouse.x - ctx.offsetWidth + 'px'
        }
        if ((ctx.offsetHeight + ctx.getBoundingClientRect().top) > window.innerHeight) {
            ctx.style.top = mouse.y - ctx.offsetHeight + 'px'
        }
    }

    doc.addEventListener('mouseup', ({ button }) => {
        if (contextMenuOpen && button !== 2) {
            timeout(50, () => {
                select `#contextMenu`.style.opacity = 0
                timeout(100, () => {
                    select `#contextMenu`.style.display = 'none'
                });
                contextMenuOpen = false
            });
        }
    })

    @Export function openWindowFromObject(object, run) {
        const { name, size, open, color, canOpen } = object

        if (type(open) === 'string') {
            if (exists(run)) {
                createWindow(name, size[0], size[1], open, color, object, canOpen, run)
            } else {
                createWindow(name, size[0], size[1], open, color, object, canOpen)
            }
        } else {
            object.open()
        }
    }

    @Export function createWindow(title, width, height, content, titleColor, icon, canOpen, run) {
        const window = <jsx>
            <div class='window' />
        </jsx>

        topWindowZIndex++

        apply(window.style, {
            zIndex: topWindowZIndex,
            width: width + 'px',
            height: height + 'px',
            '--windowTitleColor': titleColor,
        })

        interval(100, () => {
            if (data.settings.togglable.windowTransparency) {
                window.style.backgroundColor = 'transparent'
            } else {
                window.style.backgroundColor = 'rgb(30, 30, 30)'
            }
        });

        let windowContent
        if (content.startsWith('https://')) {
            windowContent = `<iframe src='${content}' />`
        } else {
            windowContent = content
        }

        if (!canOpen) {
            window.replaceChildren(<jsx>
                <div class='windowTitle'>
                    <div>
                        <span>${title}</span>
                    </div>
                    <div class='windowButtons'>
                        <div class='windowMinimize' title='Minimize window...'>
                            <img src='media/glyphs/minimize.png' />
                        </div>
                        <div class='windowFullscreen' title='Toggle fullscreen...'>
                            <img src='media/glyphs/fullscreen.png' />
                        </div>
                        <div class='windowClose' title='Close window...'>
                            <img src='media/glyphs/close.png' />
                        </div>
                    </div>
                </div>
                <div class='windowContent'>
                    ${windowContent}
                    <span style='position: absolute;'>LOADING...</span>
                </div>
            </jsx>)
        } else {
            window.replaceChildren(<jsx>
                <div class='windowTitle'>
                    <div>
                        <span>${title}</span>
                    </div>
                    <div class='windowButtons' title='Open window in new tab...'>
                        <div class='windowOpen'>
                            <img src='media/glyphs/open.png' />
                        </div>
                        <div class='windowMinimize' title='Minimize window...'>
                            <img src='media/glyphs/minimize.png' />
                        </div>
                        <div class='windowFullscreen' title='Toggle fullscreen...'>
                            <img src='media/glyphs/fullscreen.png' />
                        </div>
                        <div class='windowClose' title='Close window...'>
                            <img src='media/glyphs/close.png' />
                        </div>
                    </div>
                </div>
                <div class='windowContent'>
                    ${windowContent}
                    <span style='position: absolute;'>LOADING...</span>
                </div>
            </jsx>)
        }

        const windowTitle = select.from(window) `.windowTitle`
        let windowMoveInterval,
            windowClicked = { x: 0, y: 0 }
            pos = { x: 0, y: 0 }
            size = { x: 0, y: 0 }
            windowFullscreen = false
            windowMoving = false
            windowMinimized = false

        const taskbarIcon = <jsx>
            <img
                on:click={minimizeWindow}
                class='taskbarApp'
                src={`media/apps/${icon}.png`}
                title='title'
            />
        </jsx>

        taskbarIcon.style.scale = 0.9
        taskbarIcon.style.opacity = 0.5

        select `#taskBarLeft`.append(taskbarIcon)

        taskbarIcon.onmouseup = ({ button }) => {
            if (button === 2) {
                displayContextMenu([
                    {
                        text: 'Close window',
                        function: closeWindow
                    },
                    {
                        text: 'Pin to taskbar',
                        function() {
                            if (!data.user.taskbar.includes(icon)) {
                                pinToTaskbar(icon)
                                data.user.taskbar.push(icon)
                                save()
                            }
                        }
                    }
                ])
            }
        }


        windowTitle.addEventListener('mousedown', ({ button, clientX, clientY }) => {
            if (button === 0) {
                windowClicked.x = clientX - window.getBoundingClientRect().left
                windowClicked.y = clientY - window.getBoundingClientRect().top
                if (!windowFullscreen && !windowMoving) {
                    windowMoving = true
                    select.from(window) `.windowContent`.style.pointerEvents = 'none'
                    windowMoveInterval = interval(10, () => {
                        if (exists(data.settings.togglable.windowPosLimits)) {
                            if (mouse.x - windowClicked.x > 0 && mouse.x - windowClicked.x < realWindow.innerWidth - window.offsetWidth) {
                                window.style.left = mouse.x - windowClicked.x + 'px'
                            } else if (mouse.x - windowClicked.x < 0) {
                                window.style.left = '0px';
                            } else if (mouse.x - windowClicked.x > realWindow.innerWidth - window.offsetWidth) {
                                window.style.left = realWindow.innerWidth - window.offsetWidth + 'px'
                            }

                            if (mouse.y - windowClicked.y > 0 && mouse.y - windowClicked.y < realWindow.innerHeight - window.offsetHeight) {
                                window.style.top = mouse.y - windowClicked.y + 'px'
                            } else if (mouse.y - windowClicked.y < 0) {
                                window.style.top = '0px'
                            } else if (mouse.y - windowClicked.y > realWindow.innerHeight - window.offsetHeight) {
                                window.style.top = realWindow.innerHeight - window.offsetHeight + 'px'
                            }
                        } else {
                            window.style.left = mouse.x - windowClicked.x + 'px'
                            window.style.top = mouse.y - windowClicked.y + 'px'
                        }

                        if (!windowFullscreen) {
                            pos.x = window.style.left
                            pos.y = window.style.top
                        }
                        window.style.transition = 'scale ease-in 0.1s, opacity ease-in 0.1s, width ease-in-out 0.25s, height ease-in-out 0.25s'
                    });
                }
            }
        });

        window.addEventListener('mousedown', ({ offsetX, offsetY }) => {
            topWindowZIndex++
            window.style.zIndex = topWindowZIndex
            selectedWindow = window

            if (offsetX > window.offsetWidth - 20 && offsetY > window.offsetHeight - 20) {
                window.style.transition = 'none'
            }
        })

        window.addEventListener('mouseup', () => {
            windowMoveInterval.clear()
            windowMoving = false
            select.from(window) `.windowContent`.style.pointerEvents = 'all'

            window.style.transition = 'scale ease-in 0.1s, opacity ease-in 0.1s, width ease-in-out 0.25s, height ease-in-out 0.25s, top ease-in-out 0.25s, left ease-in-out 0.25s'
            if (pos.x + window.offsetWidth > realWindow.innerWidth) {
                window.style.width = realWindow.innerWidth + 'px'
            }
            if (!windowFullscreen) {
                size.x = window.offsetWidth
                size.y = window.offsetHeight
            }
        })

        select.from(window) `.windowTitle`.addEventListener('mouseup', ({ button }) => {
            if (button === 2) {
                displayContextMenu([
                    {
                        text: 'Close window',
                        function: closeWindow
                    },
                    {
                        text: 'Close all windows',
                        function() {
                            let i = 0;
                            select.from('#desktop').all `.window`.forEach(window => {
                                timeout(10 * i, () => {
                                    window.style.scale = '90%'
                                    window.style.opacity = '0'

                                    if (windowFullscreen) {
                                        windowsFullscreen--
                                        updateTaskbar()
                                    }

                                    timeout(100, () => {
                                        window.remove()
                                        windowsActive--
                                    });
                                });
                                i++
                            })
                            select.from('#taskBarLeft').all `.taskbarApp`.forEach(app => {
                                timeout(10 * i, () => app.remove());
                            })
                        }
                    },
                    {
                        text: 'Toggle fullscreen',
                        function: toggleFullscreen
                    },
                    {
                        text: 'Reset window position',
                        function() {
                            window.style.top = 0
                            window.style.left = 0
                            window.style.width = width + 'px'
                            window.style.height = height + 'px'
                        }
                    },
                    {
                        text: 'DESTROY window',
                        function() {
                            closeWindow()
                            DeBread.shake()
                            DeBread.shake(select `#desktop`, 10, 10, 10, 175, true, 2)
                            DeBread.createParticles(select `#desktop`,
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

        select.from(window) `.windowClose'`.onclick = closeWindow
        select.from(window) `.windowFullscreen`.onclick = toggleFullscreen
        select.from(window) `.windowMinimize`.onclick = minimizeWindow

        if (canOpen) {
            select.from(window) `.windowOpen`.onclick = () => realWindow.open(content)
        }

        function toggleFullscreen() {
            if (!windowFullscreen) {
                apply(window.style, {
                    top: '0',
                    left: '0',
                    width: '100vw',
                    height: 'calc(100vh - 57px)',
                    resize: 'none',
                    borderRadius: 0
                })

                windowsFullscreen++

                select.from(window, '.windowFullscreen') `img`.src = 'media/glyphs/window.png'
            } else {
                apply(window.style, {
                    width: size.x + 'px',
                    height: size.y + 'px',
                    top: pos.y,
                    left: pos.x,
                    resize: 'both',
                    borderRadius: '5px',
                })

                windowsFullscreen--

                select.from(window, '.windowFullscreen') `img`.src = 'media/glyphs/fullscreen.png'
            }

            updateTaskbar()
            windowFullscreen = !windowFullscreen
        }

        function closeWindow() {
            window.style.scale = '90%'
            window.style.opacity = '0'
            taskbarIcon.remove()

            if (windowFullscreen) {
                windowsFullscreen--
                updateTaskbar()
            }

            timeout(100, () => {
                window.remove()
                windowsActive--
            });
        }

        function minimizeWindow() {
            if (windowMinimized) {
                apply(window.style, {
                    opacity: 1,
                    pointerEvents: 'unset',
                    scale: 1
                })

                taskbarIcon.style.scale = 0.9
                taskbarIcon.style.opacity = 0.5

                windowMinimized = false
            } else {
                apply(window.style, {
                    opacity: 0,
                    pointerEvents: 'none',
                    scale: 0
                })

                taskbarIcon.style.scale = 1
                taskbarIcon.style.opacity = 1

                windowMinimized = true
            }
        }

        window.style.left = 10 * windowsActive + 'px'
        window.style.top = 10 * windowsActive + 'px'

        select `#desktop`.append(window)
        windowsActive++

        timeout(100, () => {
            window.style.animation = 'none'
        });

        timeout(1000, () => {
            const iframe = select.from(window) `iframe`.contentWindow

            if (type(iframe.run) === 'function') {
                iframe.contentDocument.run()
            }
        });
    }

    @Export function openApp(key) {
        const app = key

        if (type(app.open) === 'string') {
            createWindow(app.name, app.size[0], app.size[1], app.open, app.color, app, app.canOpen)
        } else {
            app.open()
        }
    }

    @Export function createNoti(img, altImg, appName, title, desc, ev) {
        let notiActive = true

        const div = <jsx>
            <div class='noti'>
                <div class='notiImgContainer' style={`background-color:` + data.settings.accentColor + ';'}>
                    <img src={img} />
                    <img src={altImg} />
                    <span>${appName}</span>
                </div>
                <div class='notiText'>
                    <span class='notiTitle'>${title}</span>
                    <br />
                    <span class='notiDesc'>${desc}</span>
                </div>
            </div>
        </jsx>

        select `#notiContainer`.append(div)

        div.onclick = function() {
            if (exists(ev)) {
                ev()
            }

            if (notiActive) {
                notiActive = false
                div.style.opacity = 0
                div.style.height = 0
                div.style.padding = '0px 5px'
                div.style.marginTop = 0
                timeout(500, () => {
                    select `#notiContainer`.removeChild(div)
                });
            }
        }

        timeout(1000, () => {
            div.style.width = '300px'
            div.style.gap = '5px'
            select.from(div) `.notiText`.style.width = '225px'
            timeout(500, () => {
                select.from(div) `.notiText`.style.opacity = 1
            });
        });

        timeout(7500, () => {
            if (notiActive) {
                notiActive = false
                div.style.opacity = 0
                div.style.height = 0
                div.style.padding = '0px 5px'
                div.style.marginTop = 0
                timeout(500, () => select `#notiContainer`.removeChild(div));
            }
        });
    }

    let appGalleryOpen = false
    const appGallery = select `#appGallery`

    @Export function openAppGallery() {
        if (!appGalleryOpen) {
            select `#desktop`.style.scale = '110%'
            select `#taskBar`.style.transform = 'translateY(100px)'

            appGallery.style.display = 'flex'
            appGallery.style.opacity = 1
            appGallery.style.pointerEvents = 'unset'
            updateAppGallery()
        } else {
            select `#desktop`.style.scale = 1
            select `#taskBar`.style.transform = 'none'
            appGallery.style.opacity = 0
            appGallery.style.pointerEvents = 'none'
        }
        appGalleryOpen = !appGalleryOpen
    }

    doc.addEventListener('keydown', ({ key }) => {
        if (key === 'Escape' && appGalleryOpen) {
            openAppGallery()
        }
    })

    const innerAppGallery = select `#innerAppGallery`

    @Export function updateAppGallery() {
        innerAppGallery.innerHTML = ''

        for (const key in apps) {
            const app = apps[key]
            const div = <jsx>
                <div class='app' title={`Open ${app.name}...`}>
                    <img src={`media/apps/${key}.png`} />
                    <span>${app.name}</span>
                </div>
            </jsx>

            innerAppGallery.append(div)
            div.onclick = function() {
                if (type(app.open) === 'string') {
                    createWindow (
                        app.name,
                        app.size[0],
                        app.size[1],
                        app.open,
                        app.color,
                        key,
                        app.canOpen
                    )
                } else {
                    app.open()
                }
                openAppGallery()
            }
        }
    }

    @Export function renderTaskbar() {
        select `#taskBarMain`.innerHTML = ''
        for (const app in data.user.taskbar) {
            pinToTaskbar(data.user.taskbar[app])
        }
    }

    renderTaskbar()

    function pinToTaskbar(app) {
        const img = <jsx>
            <img
                src={`media/apps/${app}.png`}
                on:click={() => openApp(app)}
            />
        </jsx>

        img.onmouseup = ({ button }) => {
            if (button === 2) {
                displayContextMenu (
                    [{
                        text: 'Remove from taskbar',
                        function() {
                            img.remove()
                            data.user.taskbar.splice(data.user.taskbar.indexOf(app), 1)
                            save()
                        }
                    }]
                )
            }
        }

        select `#taskBarMain`.append(img)
    }
})
