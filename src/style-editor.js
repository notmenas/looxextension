(function() {
    let usernameStyleObserver = null;

    function addUsernameStyleButton() {
        const navGroup = document.querySelector('.p-navgroup.p-discovery');
        if (!navGroup || document.querySelector('.username-style-button')) return;

        const button = document.createElement('a');
        button.href = '#';
        button.className = 'p-navgroup-link p-navgroup-link--iconic username-style-button';
        button.setAttribute('title', 'Username Style');
        button.innerHTML = `<i class="fas fa-palette" style="font-size: 16px;"></i>`;

        // Insert before the search button
        const searchButton = navGroup.querySelector('.p-navgroup-link--search');
        if (searchButton) {
            navGroup.insertBefore(button, searchButton);
        } else {
            navGroup.appendChild(button);
        }

        button.addEventListener('click', function(e) {
            e.preventDefault();
            showUsernameStylePopup();
        });
    }

    function setUsernameStyle() {
        chrome.storage.local.get('selectedUsernameStyle', ({ selectedUsernameStyle }) => {
            if (!selectedUsernameStyle) return;
            const accountLink = document.querySelector('a[href="/account/"]');
            if (!accountLink) return;
            let username = accountLink.textContent.trim().replace(/[^a-zA-Z]/g, '');
            username = username.replace(username[0],''); // Clean username
            console.log(`Setting username style for ${username} to ${selectedUsernameStyle}`);

            document.querySelectorAll('span[class*="username--style"]').forEach(el => {
                if (el.textContent.trim() === username) {
                    el.className = `username--${selectedUsernameStyle}`;
                }
            });

            // Setup MutationObserver only once
            if (!usernameStyleObserver) {
                usernameStyleObserver = new MutationObserver(() => {
                    document.querySelectorAll('span[class*="username--style"]').forEach(el => {
                        if (el.textContent.trim() === username) {
                            el.className = `username--${selectedUsernameStyle}`;
                            console.log(`Applied style ${selectedUsernameStyle} to username.`);
                        }
                        
                    });
                });
                usernameStyleObserver.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            }
        });
    }

    function showUsernameStylePopup() {
        if (document.getElementById('usernameStyleModalContainer')) return;

        const originalUsername = document.querySelector('.p-navgroup-link--user .username')?.textContent.trim() || 'YourUsername';

        // Modal container
        const modalContainer = document.createElement('div');
        modalContainer.id = 'usernameStyleModalContainer';
        modalContainer.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            z-index: 100000; display: block;
        `;

        // Overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7); z-index: 100001;
        `;

        // Modal (canvas) container
        const canvas = document.createElement('div');
        canvas.className = 'username-style-canvas';
        canvas.style.cssText = `
            position: fixed;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            background: #181824;
            color: #eee;
            padding: 28px 24px 20px 24px;
            border-radius: 12px;
            z-index: 100002;
            width: 380px;
            max-width: 95vw;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 4px 24px rgba(0,0,0,0.55);
            border: 1px solid #282828;
        `;

        // Modal content (your provided HTML)
        canvas.innerHTML = `
            <div class="overlay-title" style="margin-bottom: 20px;">
                <h3 style="margin: 0; color: #eee; font-size: 18px;">Username Style Changer</h3>
            </div>
            <div class="block-body" style="margin-bottom: 20px;">
                <div class="block-row" style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 10px; color: #eee;">Select Style:</label>
                    <div id="styleCardsContainer" style="max-height:120px;overflow-y:auto;"></div>
                </div>
                <div class="block-row" style="margin: 15px 0;">
                    <label style="display: block; margin-bottom: 5px; color: #eee;">Preview:</label>
                    <div id="usernamePreview" style="padding: 15px; background: #1a1a1a; border-radius: 5px; text-align: center; font-size: 16px; border: 1px solid #282828;">
                        <span id="previewText" class="username">${originalUsername}</span>
                    </div>
                </div>
                <div class="formSubmitRow" style="margin-top: 20px; text-align: center;">
                    <div class="formSubmitRow-main">
                        <div class="formSubmitRow-bar">
                            <button id="applyStyleChanges" class="button button--primary" style="margin-right: 10px;">Apply Changes</button>
                            <button id="resetStyle" class="button button--cta" style="margin-right: 10px;">Reset</button>
                            <button id="closeStyleModal" class="button">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add style cards (example, you can expand with your style list)
        const styleList = [
            // Basic Modifiers
            { key: 'invisible', name: 'Invisible (Hidden)' },
            { key: 'banned', name: 'Banned (Line-through)' },

            // Standard Colors
            { key: 'style2', name: 'Gray' },
            { key: 'style3', name: 'White Glow' },
            { key: 'style4', name: 'Purple' },
            { key: 'style5', name: 'Gray Line-through' },
            { key: 'style6', name: 'Gray Line-through' },
            { key: 'style7', name: 'Gray' },
            { key: 'style8', name: 'Light Blue' },
            { key: 'style9', name: 'Cyan' },
            { key: 'style10', name: 'Teal' },
            { key: 'style11', name: 'Green' },
            { key: 'style12', name: 'Yellow' },
            { key: 'style13', name: 'Amber' },
            { key: 'style14', name: 'Orange' },
            { key: 'style15', name: 'Deep Orange' },
            { key: 'style16', name: 'Red' },
            { key: 'style17', name: 'Pink' },
            { key: 'style18', name: 'Indigo' },
            { key: 'style19', name: 'Purple' },
            { key: 'style24', name: 'Red' },

            // Gradient & Animated Styles
            { key: 'style29', name: 'Gradient Red-Purple' },
            { key: 'style30', name: 'Animated Color Change' },
            { key: 'style31', name: 'White/Red Shadow Animation' },
            { key: 'style42', name: 'Gray Line-through' },

            // Premium/Staff Styles with Effects
            { key: 'style43', name: 'Gold Glow Sparkle' },
            { key: 'style44', name: 'Blue Glow Sparkle' },
            { key: 'style45', name: 'Orange-Red Glow Sparkle' },
            { key: 'style47', name: 'Purple Gradient Clip' },
            { key: 'style48', name: 'Red Gradient Gold Animation' },
            { key: 'style49', name: 'Pink Glow Sparkle' },
            { key: 'style50', name: 'Purple Sparkle' },
            { key: 'style51', name: 'Transparent Gradient BG' },
            { key: 'style52', name: 'Red Gradient Sparkle' },
            { key: 'style53', name: 'Green Glow Sparkle' },
            { key: 'style54', name: 'White Green Glow' },
            { key: 'style58', name: 'Gold Gradient Sparkle' },
            { key: 'style60', name: 'Purple' },
            { key: 'style61', name: 'Red Gradient Clip' },
            { key: 'style62', name: 'Green GIF BG' },
            { key: 'style63', name: 'Blue Gradient GIF BG' },
            { key: 'style65', name: 'Blue Gradient Clip' },
            { key: 'style66', name: 'Green-Gold Gradient Sparkle' },
            { key: 'style68', name: 'Rainbow Gradient' },
            { key: 'style69', name: 'Gold Gradient GIF BG' },
            { key: 'style70', name: 'Blue-Purple Gradient' },

            // Glow Effects (Styles 74-83)
            { key: 'style74', name: 'White Blue Glow' },
            { key: 'style75', name: 'White Purple Glow' },
            { key: 'style76', name: 'White Red Glow' },
            { key: 'style79', name: 'White Blue Glow' },
            { key: 'style80', name: 'White Black Shadow GIF BG' },
            { key: 'style81', name: 'Black White Shadow GIF BG' },
            { key: 'style82', name: 'Pink Gradient Clip' },
            { key: 'style83', name: 'Pink Gradient Multi Glow' }
        ];
        const styleCardsContainer = canvas.querySelector('#styleCardsContainer');
        styleList.forEach(style => {
            const card = document.createElement('div');
            card.className = 'style-card';
            card.setAttribute('data-style', style.key);
            card.style.cssText = `
                display: inline-block; margin: 5px; padding: 8px 12px; border-radius: 6px;
                background: #222; color: #eee; cursor: pointer; border: 2px solid #282828;
                font-weight: bold; transition: border-color 0.2s; font-size: 13px;
            `;
            card.textContent = style.name;
            card.onclick = () => {
                canvas.querySelectorAll('.style-card').forEach(c => c.style.borderColor = '#282828');
                card.style.borderColor = '#6366f1';
                canvas.querySelector('#previewText').textContent = originalUsername;
                canvas.querySelector('#previewText').className = `username username--${style.key}`;
                canvas.querySelector('#previewText').setAttribute('data-selected-style', style.key);
            };
            styleCardsContainer.appendChild(card);
        });

        // Button handlers
        overlay.onclick = () => modalContainer.remove();
        canvas.querySelector('#closeStyleModal').onclick = () => modalContainer.remove();
        canvas.querySelector('#resetStyle').onclick = () => {
            canvas.querySelector('#previewText').className = 'username';
            canvas.querySelector('#previewText').removeAttribute('data-selected-style');
        };
        canvas.querySelector('#applyStyleChanges').onclick = () => {
            const selected = canvas.querySelector('#previewText').getAttribute('data-selected-style');
            chrome.storage.local.set({ selectedUsernameStyle: selected });
            if (selected) {
                setUsernameStyle();
                console.log(`Applied style ${selected} to username.`);
            }
            modalContainer.remove();
        };

        modalContainer.appendChild(overlay);
        modalContainer.appendChild(canvas);
        document.body.appendChild(modalContainer);
    }

    // Wait for DOM and add button
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addUsernameStyleButton);
    } else {
        addUsernameStyleButton();
    }
})();