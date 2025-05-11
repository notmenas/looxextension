// Quick Reply System for looksmax.org
(function() {
    'use strict';

    // Default quick reply templates
    const defaultTemplates = {
        'dnrd': "Didn't read",
        'mogsme': "Mogs me",
        'based': "Based and blackpilled",
        'brutal': "Brutal",
        'cope': "Cope",
        'over': "It's over",
        'lifefuel': "Lifefuel",
        'suifuel': "Suifuel",
        'mirin': "Mirin'",
        'ded': "Dead serious",
        'giga': "Gigachad",
        'chad': "Chad move",
        'beta': "Beta behavior",
        'lmao': "Lmao",
        'jfl': "JFL",
        'ngl': "Not gonna lie"
    };

    let quickReplies = {};
    let isVisible = false;

    // Initialize quick replies
    function initQuickReplies() {
        chrome.storage.local.get(['quickReplies'], function(result) {
            quickReplies = result.quickReplies || { ...defaultTemplates };
            
            // Save defaults if not already saved
            if (!result.quickReplies) {
                chrome.storage.local.set({ quickReplies: quickReplies });
            }
            
            // Add quick reply button to the page
            addQuickReplyButton();
            addReplyButtonsToActionBars();
            injectCustomStyles();
        });
    }

    // Inject custom styles for quick reply UI
    function injectCustomStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .quick-reply-container {
                position: fixed;
                right: 20px;
                bottom: 100px;
                z-index: 9999;
                display: flex;
                flex-direction: column-reverse;
                gap: 10px;
                pointer-events: auto;
            }

            .quick-reply-toggle {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: linear-gradient(135deg, #6366f1, #4f46e5);
                color: white;
                border: none;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                transition: transform 0.2s, box-shadow 0.2s;
                position: relative;
            }

            .quick-reply-toggle:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
            }

            .quick-reply-menu {
                background: #1e1e2e;
                border: 1px solid #2d2d3f;
                border-radius: 12px;
                padding: 8px;
                max-height: 400px;
                overflow-y: auto;
                display: none;
                flex-direction: column;
                gap: 4px;
                min-width: 200px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
            }

            .quick-reply-menu.visible {
                display: flex;
            }

            .quick-reply-item {
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: #e3e3e3;
                background: #252535;
                transition: background 0.2s;
                font-family: 'Segoe UI', sans-serif;
                font-size: 14px;
            }

            .quick-reply-item:hover {
                background: #6366f1;
            }

            .quick-reply-key {
                font-weight: bold;
                color: #6366f1;
                width: 60px;
            }

            .quick-reply-value {
                color: #a0a0b0;
                margin-left: 10px;
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .quick-reply-add {
                padding: 8px 12px;
                text-align: center;
                color: #6366f1;
                border-top: 1px solid #2d2d3f;
                cursor: pointer;
                font-size: 13px;
                transition: background 0.2s;
            }

            .quick-reply-add:hover {
                background: rgba(99, 102, 241, 0.1);
            }

            /* Quick reply buttons in action bar */
            .quick-reply-action {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 4px 8px;
                font-size: 13px;
                color: #6366f1;
                cursor: pointer;
                transition: background 0.2s;
                border-radius: 4px;
                margin-left: 8px;
            }

            .quick-reply-action:hover {
                background: rgba(99, 102, 241, 0.1);
            }

            /* Scrollbar styling */
            .quick-reply-menu::-webkit-scrollbar {
                width: 6px;
            }

            .quick-reply-menu::-webkit-scrollbar-thumb {
                background: #6366f1;
                border-radius: 3px;
            }

            .quick-reply-menu::-webkit-scrollbar-track {
                background: #252535;
                border-radius: 3px;
            }
        `;
        document.head.appendChild(style);
    }

    // Add quick reply buttons to each post's action bar
    function addReplyButtonsToActionBars() {
        const actionBars = document.querySelectorAll('.actionBar');
        
        actionBars.forEach(actionBar => {
            // Skip if already added
            if (actionBar.querySelector('.quick-reply-action')) return;
            
            // Create quick reply button
            const quickReplyBtn = document.createElement('span');
            quickReplyBtn.className = 'quick-reply-action';
            quickReplyBtn.innerHTML = '⚡ Quick';
            quickReplyBtn.title = 'Quick Reply';
            
            // Find the original reply button
            const replyBtn = actionBar.querySelector('.actionBar-action--reply');
            if (replyBtn) {
                // Insert our button after the reply button
                replyBtn.insertAdjacentElement('afterend', quickReplyBtn);
                
                // Handle click
                quickReplyBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    showQuickReplyMenu(e.target, actionBar);
                };
            }
        });
    }

    // Show quick reply menu near the clicked action bar
    function showQuickReplyMenu(targetElement, actionBar) {
        // Remove any existing menus
        document.querySelectorAll('.quick-reply-inline-menu').forEach(menu => menu.remove());
        
        const menu = document.createElement('div');
        menu.className = 'quick-reply-inline-menu';
        menu.style.cssText = `
            position: absolute;
            background: #1e1e2e;
            border: 1px solid #2d2d3f;
            border-radius: 8px;
            padding: 8px;
            z-index: 10000;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 6px;
            width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        
        // Create menu items
        Object.entries(quickReplies).forEach(([key, value]) => {
            const item = document.createElement('div');
            item.className = 'quick-reply-item';
            item.style.cssText = `
                padding: 6px 10px;
                background: #252535;
                border-radius: 4px;
                cursor: pointer;
                text-align: center;
                color: #e3e3e3;
                font-size: 13px;
                transition: background 0.2s;
            `;
            item.textContent = key;
            item.title = value;
            
            item.onclick = () => {
                insertReplyWithXenForo(value, actionBar);
                menu.remove();
            };
            
            item.onmouseover = () => item.style.background = '#6366f1';
            item.onmouseout = () => item.style.background = '#252535';
            
            menu.appendChild(item);
        });
        
        // Position menu
        const rect = targetElement.getBoundingClientRect();
        menu.style.left = rect.left + 'px';
        menu.style.top = (rect.bottom + 5) + 'px';
        
        // Hide when clicking outside
        setTimeout(() => {
            const hideOnClick = (e) => {
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', hideOnClick);
                }
            };
            document.addEventListener('click', hideOnClick);
        }, 10);
        
        document.body.appendChild(menu);
    }

    // Add floating quick reply button to the page
    function addQuickReplyButton() {
        const container = document.createElement('div');
        container.className = 'quick-reply-container';
        
        const toggleButton = document.createElement('button');
        toggleButton.className = 'quick-reply-toggle';
        toggleButton.innerHTML = '⚡';
        toggleButton.title = 'Quick Replies';
        
        const menu = document.createElement('div');
        menu.className = 'quick-reply-menu';
        
        // Create menu items
        Object.entries(quickReplies).forEach(([key, value]) => {
            const item = createReplyItem(key, value);
            menu.appendChild(item);
        });
        
        // Add "New Reply" button
        const addButton = document.createElement('div');
        addButton.className = 'quick-reply-add';
        addButton.textContent = '+ Add Quick Reply';
        addButton.onclick = showAddReplyDialog;
        menu.appendChild(addButton);
        
        // Toggle menu visibility
        toggleButton.onclick = (e) => {
            e.stopPropagation();
            isVisible = !isVisible;
            menu.classList.toggle('visible', isVisible);
        };
        
        // Hide menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                isVisible = false;
                menu.classList.remove('visible');
            }
        });
        
        container.appendChild(menu);
        container.appendChild(toggleButton);
        document.body.appendChild(container);
    }

    // Create a reply item element
    function createReplyItem(key, value) {
        const item = document.createElement('div');
        item.className = 'quick-reply-item';
        
        const keySpan = document.createElement('span');
        keySpan.className = 'quick-reply-key';
        keySpan.textContent = key;
        
        const valueSpan = document.createElement('span');
        valueSpan.className = 'quick-reply-value';
        valueSpan.textContent = value;
        
        item.appendChild(keySpan);
        item.appendChild(valueSpan);
        
        // Insert reply on click
        item.onclick = () => {
            insertReplyWithXenForo(value);
            // Hide menu after insertion
            isVisible = false;
            document.querySelector('.quick-reply-menu').classList.remove('visible');
        };
        
        // Right-click to edit/delete
        item.oncontextmenu = (e) => {
            e.preventDefault();
            showEditDialog(key, value);
        };
        
        return item;
    }

    // Insert quick reply using XenForo's reply system
    function insertReplyWithXenForo(text, targetActionBar = null) {
        // If targetActionBar is provided, use the reply button in that specific action bar
        let replyButton;
        if (targetActionBar) {
            replyButton = targetActionBar.querySelector('.actionBar-action--reply');
        } else {
            // Otherwise, use the main reply button at the bottom of the page
            replyButton = document.querySelector('#js-quickReply .button--icon--reply');
            if (!replyButton) {
                // If quick reply isn't available, use the first reply button
                replyButton = document.querySelector('.actionBar-action--reply');
            }
        }
        
        if (!replyButton) {
            console.log('No reply button found');
            return;
        }
        
        // Click the reply button to open the editor
        replyButton.click();
        
        // Wait for the editor to load and then insert text
        setTimeout(() => {
            const editor = document.querySelector('.fr-element.fr-view');
            if (editor) {
                // Insert into the rich text editor
                editor.focus();
                
                // If there's already text, add a space before
                if (editor.textContent.trim()) {
                    text = ' ' + text;
                }
                
                // Insert the text
                document.execCommand('insertText', false, text);
            } else {
                // Fallback to textarea if rich editor not found
                const textarea = document.querySelector('textarea[name="message"]');
                if (textarea) {
                    textarea.focus();
                    
                    // If there's already text, add a space before
                    if (textarea.value.trim()) {
                        text = ' ' + text;
                    }
                    
                    // Insert the text
                    const cursorPos = textarea.selectionStart;
                    textarea.value = textarea.value.slice(0, cursorPos) + text + textarea.value.slice(cursorPos);
                    textarea.setSelectionRange(cursorPos + text.length, cursorPos + text.length);
                }
            }
        }, 100);
    }

    // Show dialog to add new quick reply
    function showAddReplyDialog() {
        const key = prompt('Enter quick reply shortcut (e.g., "dnrd"):');
        if (!key) return;
        
        const value = prompt('Enter the full text for this reply:');
        if (!value) return;
        
        // Add to quick replies
        quickReplies[key] = value;
        
        // Save to storage
        chrome.storage.local.set({ quickReplies: quickReplies }, () => {
            // Rebuild menu
            rebuildMenu();
            // Update action bars
            addReplyButtonsToActionBars();
        });
    }

    // Show dialog to edit/delete existing reply
    function showEditDialog(key, value) {
        const action = prompt(`Edit or Delete "${key}"?\nType "edit" to edit, "delete" to delete, or cancel:`);
        
        if (action === 'edit') {
            const newValue = prompt('Enter new text:', value);
            if (newValue !== null) {
                quickReplies[key] = newValue;
                chrome.storage.local.set({ quickReplies: quickReplies }, rebuildMenu);
            }
        } else if (action === 'delete') {
            if (confirm(`Delete quick reply "${key}"?`)) {
                delete quickReplies[key];
                chrome.storage.local.set({ quickReplies: quickReplies }, rebuildMenu);
            }
        }
    }

    // Rebuild the menu items
    function rebuildMenu() {
        const menu = document.querySelector('.quick-reply-menu');
        
        // Remove all items except the add button
        Array.from(menu.children).forEach(child => {
            if (!child.classList.contains('quick-reply-add')) {
                child.remove();
            }
        });
        
        // Add all reply items
        Object.entries(quickReplies).forEach(([key, value]) => {
            const item = createReplyItem(key, value);
            menu.insertBefore(item, menu.lastChild); // Insert before add button
        });
    }

    // Update action bars when new content is added (for dynamic content)
    const observer = new MutationObserver((mutations) => {
        addReplyButtonsToActionBars();
    });

    // Observe for new posts
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Initialize when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initQuickReplies);
    } else {
        initQuickReplies();
    }
})();