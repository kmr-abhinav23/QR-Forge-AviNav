/**
 * QR Forge - AviNav v2.0
 * Pure Client-side Frontend Platform (Light Theme)
 */

document.addEventListener('DOMContentLoaded', () => {

    // =======================================
    // 1. Service Worker & PWA Registration
    // =======================================
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('PWA ServiceWorker registered:', reg.scope))
            .catch(err => console.warn('PWA ServiceWorker failed:', err));
    }

    // =======================================
    // 2. Toast Notification Engine
    // =======================================
    window.showToast = function (message, type = 'info') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const icons = {
            success: 'fa-solid fa-circle-check',
            info: 'fa-solid fa-circle-info',
            warning: 'fa-solid fa-triangle-exclamation',
            danger: 'fa-solid fa-circle-xmark'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="${icons[type] || icons.info}"></i> <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 3000);
    };

    // Remove legacy theme settings
    localStorage.removeItem('qr_forge_theme');
    document.documentElement.removeAttribute('data-theme');

    // =======================================
    // 3. LocalStorage QR History Manager
    // =======================================
    const HISTORY_KEY = 'qr_forge_history';

    window.HistoryManager = {
        getAll: function () {
            try {
                return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
            } catch (e) {
                return [];
            }
        },
        save: function (item) {
            let history = this.getAll();
            const newItem = {
                id: 'qr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                type: item.type || 'Universal',
                title: item.title || item.content.slice(0, 30),
                content: item.content,
                date: new Date().toISOString(),
                thumbnail: item.thumbnail || '',
                isFavorite: false
            };
            if (history.length > 0 && history[0].content === newItem.content) {
                return history[0];
            }
            history.unshift(newItem);
            if (history.length > 100) history.pop();
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
            return newItem;
        },
        delete: function (id) {
            let history = this.getAll().filter(item => item.id !== id);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        },
        clearAll: function () {
            localStorage.removeItem(HISTORY_KEY);
        },
        toggleFav: function (id) {
            let history = this.getAll();
            let found = history.find(item => item.id === id);
            if (found) {
                found.isFavorite = !found.isFavorite;
                localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
            }
            return found ? found.isFavorite : false;
        }
    };

    // =======================================
    // 4. Navigation & Mobile Menu Setup
    // =======================================
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('show');
            const icon = mobileBtn.querySelector('i');
            if (icon) {
                icon.className = navLinks.classList.contains('show') ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
            }
        });
    }

    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPath || (currentPath === '' && linkPath === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // =======================================
    // 5. Home Page Stats Counter
    // =======================================
    const statValues = document.querySelectorAll('.stat-value');
    if (statValues.length > 0) {
        const animateCounters = () => {
            statValues.forEach(stat => {
                const target = +stat.getAttribute('data-target');
                const duration = 2000;
                const increment = target / (duration / 16);
                let current = 0;

                const updateCounter = () => {
                    current += increment;
                    if (current < target) {
                        if (target >= 100000) {
                            const count = Math.floor(current);
                            if (count >= 100000) {
                                stat.innerText = '1Lakh+';
                            } else if (count >= 1000) {
                                stat.innerText = Math.floor(count / 1000) + 'k';
                            } else {
                                stat.innerText = count;
                            }
                        } else {
                            stat.innerText = Math.ceil(current);
                        }
                        requestAnimationFrame(updateCounter);
                    } else {
                        if (target >= 100000) {
                            stat.innerText = '1Lakh+';
                        } else {
                            stat.innerText = target + (target >= 100 ? '+' : '');
                        }
                    }
                };
                updateCounter();
            });
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounters();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        statValues.forEach(stat => observer.observe(stat));
    }

    // =======================================
    // 6. QRCodeStyling Core Engine & Studio
    // =======================================
    const qrContainer = document.getElementById('qrcode');
    let currentQRData = "";
    let currentQRType = "Universal";

    let qrConfig = {
        width: 360,
        height: 360,
        data: "https://github.com",
        margin: 2,
        qrOptions: { typeNumber: 0, mode: "Byte", errorCorrectionLevel: "M" },
        imageOptions: { hideBackgroundDots: true, imageSize: 0.3, margin: 5 },
        dotsOptions: { type: "square", color: "#000000" },
        backgroundOptions: { color: "#ffffff" },
        cornersSquareOptions: { type: "square", color: "#000000" },
        cornersDotOptions: { type: "square", color: "#000000" },
        image: ""
    };

    let qrCodeStylingInstance = null;
    if (typeof QRCodeStyling !== 'undefined') {
        qrCodeStylingInstance = new QRCodeStyling(qrConfig);
    }

    let activeFrameStyle = "none";
    let activeFrameText = "SCAN ME";

    window.triggerGenerateQR = function (dataStr, typeName = "Universal") {
        if (!qrContainer) return;

        currentQRData = dataStr;
        currentQRType = typeName;

        qrContainer.innerHTML = '';

        if (!dataStr || dataStr.trim() === '') {
            qrContainer.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding: 40px 10px;"><i class="fa-solid fa-qrcode" style="font-size: 40px; margin-bottom: 10px;"></i><br>Enter data to generate QR</div>';
            return;
        }

        if (dataStr.length > 2800) {
            showToast('Payload too large for QR code (Max ~2.8KB limit)', 'warning');
            qrContainer.innerHTML = '<div style="color:var(--danger); text-align:center; padding: 30px 10px;"><i class="fa-solid fa-triangle-exclamation" style="font-size: 36px; margin-bottom: 10px;"></i><br>Image/Data payload too large for QR storage limit. Please select a smaller file or URL.</div>';
            return;
        }

        qrConfig.data = dataStr;
        // Use lower error correction for longer data strings to fit capacity
        qrConfig.qrOptions.errorCorrectionLevel = dataStr.length > 800 ? "L" : "M";

        if (qrCodeStylingInstance) {
            try {
                qrCodeStylingInstance.update(qrConfig);

                const frameWrapper = document.createElement('div');
                if (activeFrameStyle !== 'none') {
                    frameWrapper.className = `qr-frame-wrapper frame-${activeFrameStyle}`;
                    qrCodeStylingInstance.append(frameWrapper);
                    const frameLabel = document.createElement('div');
                    frameLabel.className = 'qr-frame-text';
                    frameLabel.innerText = activeFrameText;
                    frameWrapper.appendChild(frameLabel);
                    qrContainer.appendChild(frameWrapper);
                } else {
                    qrCodeStylingInstance.append(qrContainer);
                }

                setTimeout(() => {
                    const canvas = qrContainer.querySelector('canvas');
                    let thumbUrl = "";
                    if (canvas) thumbUrl = canvas.toDataURL('image/png', 0.5);
                    HistoryManager.save({
                        type: currentQRType,
                        title: getQRTitle(currentQRType, dataStr),
                        content: dataStr,
                        thumbnail: thumbUrl
                    });
                }, 600);
            } catch (err) {
                console.error("QR Code Generation Error:", err);
                qrContainer.innerHTML = '<div style="color:var(--danger); text-align:center; padding: 30px 10px;"><i class="fa-solid fa-triangle-exclamation" style="font-size: 36px; margin-bottom: 10px;"></i><br>Could not generate QR code. Data exceeds storage limit.</div>';
                showToast('Could not generate QR. Data size too large.', 'danger');
            }
        } else {
            qrContainer.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(dataStr)}" alt="QR Code">`;
        }
    };

    function getQRTitle(type, content) {
        if (type === 'UPI') return 'UPI Payment';
        if (type === 'WhatsApp') return 'WhatsApp Contact';
        if (type === 'WiFi') return 'WiFi Network';
        if (content.startsWith('http://') || content.startsWith('https://')) return 'Website URL';
        if (content.startsWith('mailto:')) return 'Email Address';
        if (content.startsWith('tel:')) return 'Phone Contact';
        if (content.startsWith('BEGIN:VCARD')) return 'VCard Contact';
        return content.length > 25 ? content.substring(0, 25) + '...' : content;
    }

    if (qrContainer) {
        qrContainer.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding: 40px 10px;"><i class="fa-solid fa-qrcode" style="font-size: 40px; margin-bottom: 10px;"></i><br>Enter data to generate QR</div>';
    }

    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const targetId = header.getAttribute('data-target');
            const target = document.getElementById(targetId);
            if (target) {
                target.classList.toggle('open');
                const icon = header.querySelector('.acc-icon');
                if (icon) {
                    icon.className = target.classList.contains('open') ? 'fa-solid fa-chevron-up acc-icon' : 'fa-solid fa-chevron-down acc-icon';
                }
            }
        });
    });

    const templatePresets = {
        business: { dots: 'square', dotsColor: '#1e293b', bgColor: '#ffffff', eyeStyle: 'square', eyeColor: '#0f172a' },
        birthday: { dots: 'dots', dotsColor: '#e11d48', bgColor: '#fff1f2', eyeStyle: 'dot', eyeColor: '#be123c' },
        wedding: { dots: 'classy', dotsColor: '#9333ea', bgColor: '#faf5ff', eyeStyle: 'extra-rounded', eyeColor: '#7e22ce' },
        festival: { dots: 'rounded', dotsColor: '#ea580c', bgColor: '#fff7ed', eyeStyle: 'dot', eyeColor: '#c2410c' },
        restaurant: { dots: 'classy-rounded', dotsColor: '#059669', bgColor: '#ecfdf5', eyeStyle: 'square', eyeColor: '#047857' },
        shop: { dots: 'dots', dotsColor: '#2563eb', bgColor: '#eff6ff', eyeStyle: 'extra-rounded', eyeColor: '#1d4ed8' },
        invoice: { dots: 'square', dotsColor: '#0f172a', bgColor: '#f8fafc', eyeStyle: 'square', eyeColor: '#334155' },
        modern: { dots: 'extra-rounded', dotsColor: '#4f46e5', bgColor: '#e0e7ff', eyeStyle: 'extra-rounded', eyeColor: '#3730a3' },
        minimal: { dots: 'square', dotsColor: '#334155', bgColor: '#ffffff', eyeStyle: 'square', eyeColor: '#1e293b' },
        premium: { dots: 'classy', dotsColor: '#d97706', bgColor: '#1e293b', eyeStyle: 'extra-rounded', eyeColor: '#f59e0b' }
    };

    document.querySelectorAll('.template-badge').forEach(badge => {
        badge.addEventListener('click', () => {
            document.querySelectorAll('.template-badge').forEach(b => b.classList.remove('active'));
            badge.classList.add('active');
            const key = badge.getAttribute('data-template');
            const preset = templatePresets[key];
            if (preset) {
                qrConfig.dotsOptions.type = preset.dots;
                qrConfig.dotsOptions.color = preset.dotsColor;
                qrConfig.backgroundOptions.color = preset.bgColor;
                qrConfig.cornersSquareOptions.type = preset.eyeStyle;
                qrConfig.cornersSquareOptions.color = preset.eyeColor;
                qrConfig.cornersDotOptions.type = preset.eyeStyle === 'dot' ? 'dot' : 'square';
                qrConfig.cornersDotOptions.color = preset.eyeColor;

                const fgInput = document.getElementById('qrFgColor');
                const bgInput = document.getElementById('qrBgColor');
                if (fgInput) fgInput.value = preset.dotsColor;
                if (bgInput) bgInput.value = preset.bgColor;

                if (currentQRData) window.triggerGenerateQR(currentQRData, currentQRType);
                showToast(`Applied ${key.toUpperCase()} Template`, 'success');
            }
        });
    });

    document.querySelectorAll('.frame-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.frame-card').forEach(f => f.classList.remove('active'));
            card.classList.add('active');
            activeFrameStyle = card.getAttribute('data-frame');
            if (currentQRData) window.triggerGenerateQR(currentQRData, currentQRType);
        });
    });

    const frameTextInput = document.getElementById('frameTextInput');
    if (frameTextInput) {
        frameTextInput.addEventListener('input', (e) => {
            activeFrameText = e.target.value.trim() || 'SCAN ME';
            if (currentQRData) window.triggerGenerateQR(currentQRData, currentQRType);
        });
    }

    document.querySelectorAll('[data-shape]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-shape]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            qrConfig.dotsOptions.type = btn.getAttribute('data-shape');
            if (currentQRData) window.triggerGenerateQR(currentQRData, currentQRType);
        });
    });

    document.querySelectorAll('[data-eye]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-eye]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const style = btn.getAttribute('data-eye');
            qrConfig.cornersSquareOptions.type = style;
            qrConfig.cornersDotOptions.type = style === 'dot' ? 'dot' : 'square';
            if (currentQRData) window.triggerGenerateQR(currentQRData, currentQRType);
        });
    });

    const logoInput = document.getElementById('logoFileInput');
    const removeLogoBtn = document.getElementById('removeLogoBtn');
    const logoSizeSlider = document.getElementById('logoSizeSlider');
    const logoPreviewImg = document.getElementById('logoPreviewImg');

    if (logoInput) {
        logoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    qrConfig.image = evt.target.result;
                    if (logoPreviewImg) logoPreviewImg.src = evt.target.result;
                    if (removeLogoBtn) removeLogoBtn.style.display = 'inline-flex';
                    if (currentQRData) window.triggerGenerateQR(currentQRData, currentQRType);
                    showToast('Logo attached to QR!', 'success');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (removeLogoBtn) {
        removeLogoBtn.addEventListener('click', () => {
            qrConfig.image = "";
            if (logoPreviewImg) logoPreviewImg.src = "";
            if (logoInput) logoInput.value = "";
            removeLogoBtn.style.display = 'none';
            if (currentQRData) window.triggerGenerateQR(currentQRData, currentQRType);
            showToast('Logo removed', 'info');
        });
    }

    if (logoSizeSlider) {
        logoSizeSlider.addEventListener('input', (e) => {
            qrConfig.imageOptions.imageSize = parseFloat(e.target.value);
            if (currentQRData) window.triggerGenerateQR(currentQRData, currentQRType);
        });
    }

    const fgColorInput = document.getElementById('qrFgColor');
    const bgColorInput = document.getElementById('qrBgColor');
    const eyeColorInput = document.getElementById('qrEyeColor');
    const gradientCheck = document.getElementById('enableGradient');
    const gradientColorInput = document.getElementById('qrGradientColor');

    if (fgColorInput) {
        fgColorInput.addEventListener('input', (e) => {
            qrConfig.dotsOptions.color = e.target.value;
            if (currentQRData) window.triggerGenerateQR(currentQRData, currentQRType);
        });
    }

    if (bgColorInput) {
        bgColorInput.addEventListener('input', (e) => {
            qrConfig.backgroundOptions.color = e.target.value;
            if (currentQRData) window.triggerGenerateQR(currentQRData, currentQRType);
        });
    }

    if (eyeColorInput) {
        eyeColorInput.addEventListener('input', (e) => {
            qrConfig.cornersSquareOptions.color = e.target.value;
            qrConfig.cornersDotOptions.color = e.target.value;
            if (currentQRData) window.triggerGenerateQR(currentQRData, currentQRType);
        });
    }

    if (gradientCheck && gradientColorInput) {
        const updateGradient = () => {
            if (gradientCheck.checked) {
                qrConfig.dotsOptions.gradient = {
                    type: "linear",
                    rotation: 45,
                    colorStops: [
                        { offset: 0, color: fgColorInput ? fgColorInput.value : "#667eea" },
                        { offset: 1, color: gradientColorInput.value }
                    ]
                };
            } else {
                delete qrConfig.dotsOptions.gradient;
            }
            if (currentQRData) window.triggerGenerateQR(currentQRData, currentQRType);
        };
        gradientCheck.addEventListener('change', updateGradient);
        gradientColorInput.addEventListener('input', updateGradient);
    }

    // =======================================
    // 7. Page Specific Forms & Generators
    // =======================================

    // --- 1. UPI Generator ---
    const generateUpiBtn = document.getElementById('generateUpiBtn');
    if (generateUpiBtn) {
        const upiForm = document.getElementById('upiForm');
        const triggerUpi = () => {
            const upiId = document.getElementById('upiId').value.trim();
            const payeeName = document.getElementById('payeeName').value.trim();
            const amount = document.getElementById('amount').value.trim();
            const note = document.getElementById('note').value.trim();

            if (!upiId || !payeeName) return;

            let upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}`;
            if (amount) upiString += `&am=${encodeURIComponent(amount)}`;
            upiString += `&cu=INR`;
            if (note) upiString += `&tn=${encodeURIComponent(note)}`;

            window.triggerGenerateQR(upiString, "UPI");
        };

        generateUpiBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const upiId = document.getElementById('upiId').value.trim();
            const payeeName = document.getElementById('payeeName').value.trim();
            if (!upiId || !payeeName) {
                showToast('Please fill out UPI ID and Payee Name', 'warning');
                return;
            }
            triggerUpi();
            showToast('UPI QR Generated!', 'success');
        });

        if (upiForm) {
            upiForm.querySelectorAll('input').forEach(input => {
                input.addEventListener('input', triggerUpi);
            });
        }
    }

    // --- 2. WhatsApp Generator ---
    const generateWaBtn = document.getElementById('generateWaBtn');
    if (generateWaBtn) {
        const waForm = document.getElementById('waForm');
        const triggerWa = () => {
            const waPhone = document.getElementById('waPhone').value.trim();
            const waMessage = document.getElementById('waMessage').value.trim();
            if (!waPhone) return;

            let waString = `https://wa.me/${encodeURIComponent(waPhone)}`;
            if (waMessage) waString += `?text=${encodeURIComponent(waMessage)}`;

            window.triggerGenerateQR(waString, "WhatsApp");
        };

        generateWaBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const waPhone = document.getElementById('waPhone').value.trim();
            if (!waPhone) {
                showToast('Phone Number is required', 'warning');
                return;
            }
            triggerWa();
            showToast('WhatsApp QR Generated!', 'success');
        });

        if (waForm) {
            waForm.querySelectorAll('input, textarea').forEach(input => {
                input.addEventListener('input', triggerWa);
            });
        }
    }

    // --- 3. WiFi Generator ---
    const generateWifiBtn = document.getElementById('generateWifiBtn');
    if (generateWifiBtn) {
        const wifiForm = document.getElementById('wifiForm');
        const triggerWifi = () => {
            const ssid = document.getElementById('wifiSsid').value.trim();
            const password = document.getElementById('wifiPassword').value.trim();
            const security = document.getElementById('wifiSecurity').value;
            const hidden = document.getElementById('wifiHidden').checked;

            if (!ssid) return;

            const escapeString = (str) => str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/:/g, '\\:');
            let wifiString = `WIFI:T:${security};S:${escapeString(ssid)};`;
            if (security !== 'nopass' && password) {
                wifiString += `P:${escapeString(password)};`;
            } else if (security !== 'nopass' && !password) {
                wifiString += `P:;`;
            }
            if (hidden) wifiString += `H:true;`;
            wifiString += `;`;

            window.triggerGenerateQR(wifiString, "WiFi");
        };

        generateWifiBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const ssid = document.getElementById('wifiSsid').value.trim();
            if (!ssid) {
                showToast('SSID (Network Name) is required', 'warning');
                return;
            }
            triggerWifi();
            showToast('WiFi QR Generated!', 'success');
        });

        if (wifiForm) {
            wifiForm.querySelectorAll('input, select').forEach(input => {
                input.addEventListener('input', triggerWifi);
            });
        }
    }

    // --- 4. Universal Generator (9 Modes) ---
    const generateUniBtn = document.getElementById('generateUniBtn');
    if (generateUniBtn) {
        const tabs = document.querySelectorAll('.tab-btn');
        const contents = document.querySelectorAll('.tab-content');
        let activeTab = 'tab-text';

        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));

                tab.classList.add('active');
                const targetId = tab.getAttribute('data-tab');
                const targetEl = document.getElementById(targetId);
                if (targetEl) targetEl.classList.add('active');
                activeTab = targetId;

                triggerUni();
            });
        });

        const imgFileInput = document.getElementById('uniImageFile');
        const imgCompressPreview = document.getElementById('imgCompressPreview');
        let uploadedCompressedBase64 = "";

        if (imgFileInput) {
            imgFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            // Downscale to 60px & low compression to make QR code blocks significantly larger and cleaner
                            let w = img.width, h = img.height;
                            const maxDim = 60;
                            if (w > maxDim || h > maxDim) {
                                if (w > h) {
                                    h = Math.round((h * maxDim) / w);
                                    w = maxDim;
                                } else {
                                    w = Math.round((w * maxDim) / h);
                                    h = maxDim;
                                }
                            }
                            canvas.width = w;
                            canvas.height = h;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, w, h);
                            uploadedCompressedBase64 = canvas.toDataURL('image/jpeg', 0.25);
                            if (imgCompressPreview) {
                                imgCompressPreview.src = uploadedCompressedBase64;
                                imgCompressPreview.style.display = 'block';
                            }
                            triggerUni();
                            showToast('Image processed into clean, large QR code!', 'success');
                        };
                        img.src = evt.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        const triggerUni = () => {
            let dataStr = "";
            let typeName = "Universal";

            if (activeTab === 'tab-text') {
                dataStr = document.getElementById('uniText').value.trim();
                typeName = "Text";
            } else if (activeTab === 'tab-url') {
                dataStr = document.getElementById('uniUrl').value.trim();
                typeName = "URL";
            } else if (activeTab === 'tab-imagelink') {
                dataStr = document.getElementById('uniImageLink').value.trim();
                typeName = "Image Link";
            } else if (activeTab === 'tab-imageupload') {
                dataStr = uploadedCompressedBase64;
                typeName = "Image Data";
            } else if (activeTab === 'tab-email') {
                const email = document.getElementById('uniEmail').value.trim();
                const subj = document.getElementById('uniEmailSubj').value.trim();
                const body = document.getElementById('uniEmailBody').value.trim();
                if (email) {
                    dataStr = `mailto:${email}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
                }
                typeName = "Email";
            } else if (activeTab === 'tab-sms') {
                const phone = document.getElementById('uniSmsPhone').value.trim();
                const msg = document.getElementById('uniSmsMsg').value.trim();
                if (phone) {
                    dataStr = `sms:${phone}?body=${encodeURIComponent(msg)}`;
                }
                typeName = "SMS";
            } else if (activeTab === 'tab-phone') {
                const phone = document.getElementById('uniPhone').value.trim();
                if (phone) dataStr = `tel:${phone}`;
                typeName = "Phone";
            } else if (activeTab === 'tab-location') {
                const lat = document.getElementById('uniLat').value.trim();
                const lng = document.getElementById('uniLng').value.trim();
                const mapUrl = document.getElementById('uniMapUrl').value.trim();
                if (mapUrl) {
                    dataStr = mapUrl;
                } else if (lat && lng) {
                    dataStr = `geo:${lat},${lng}`;
                }
                typeName = "Location";
            } else if (activeTab === 'tab-vcard') {
                const name = document.getElementById('vName').value.trim();
                const phone = document.getElementById('vPhone').value.trim();
                const email = document.getElementById('vEmail').value.trim();
                const company = document.getElementById('vCompany').value.trim();
                const web = document.getElementById('vWeb').value.trim();
                const addr = document.getElementById('vAddress').value.trim();

                if (name || phone || email) {
                    dataStr = `BEGIN:VCARD\nVERSION:3.0\nN:${name}\nFN:${name}\nTEL:${phone}\nEMAIL:${email}\nORG:${company}\nURL:${web}\nADR:${addr}\nEND:VCARD`;
                }
                typeName = "VCard";
            }

            if (!dataStr) {
                if (qrContainer) qrContainer.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding: 40px 10px;"><i class="fa-solid fa-qrcode" style="font-size: 40px; margin-bottom: 10px;"></i><br>Enter data to generate QR</div>';
                return;
            }

            window.triggerGenerateQR(dataStr, typeName);
        };

        generateUniBtn.addEventListener('click', (e) => {
            e.preventDefault();
            triggerUni();
            showToast('QR Code Generated!', 'success');
        });

        document.querySelectorAll('#uniForm input, #uniForm textarea').forEach(input => {
            input.addEventListener('input', triggerUni);
        });
    }

    // =======================================
    // 8. Export & Share Modal System
    // =======================================
    const exportModal = document.getElementById('exportModal');
    const openExportBtn = document.getElementById('openExportBtn');
    const closeExportBtn = document.getElementById('closeExportBtn');
    const confirmDownloadBtn = document.getElementById('confirmDownloadBtn');

    let selectedExportFormat = "png";
    let selectedExportSize = 1000;

    if (openExportBtn && exportModal) {
        openExportBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!currentQRData) {
                showToast('Please generate a QR code first!', 'warning');
                return;
            }
            exportModal.classList.add('active');
        });
    }

    if (closeExportBtn && exportModal) {
        closeExportBtn.addEventListener('click', () => exportModal.classList.remove('active'));
    }

    document.querySelectorAll('[data-fmt]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-fmt]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedExportFormat = btn.getAttribute('data-fmt');
        });
    });

    document.querySelectorAll('[data-res]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-res]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedExportSize = parseInt(btn.getAttribute('data-res'), 10);
        });
    });

    if (confirmDownloadBtn) {
        confirmDownloadBtn.addEventListener('click', () => {
            if (!currentQRData) return;

            showToast('Preparing high-res download...', 'info');

            const tempConfig = JSON.parse(JSON.stringify(qrConfig));
            tempConfig.width = selectedExportSize;
            tempConfig.height = selectedExportSize;

            const tempStyling = new QRCodeStyling(tempConfig);
            const fileName = `QR_Forge_AviNav_${Date.now()}`;

            if (selectedExportFormat === 'pdf') {
                tempStyling.getRawData('png').then(blob => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const { jsPDF } = window.jspdf;
                        const doc = new jsPDF();
                        doc.text("QR Forge - AviNav Generated QR Code", 15, 20);
                        doc.addImage(reader.result, 'PNG', 15, 30, 180, 180);
                        doc.save(`${fileName}.pdf`);
                        if (exportModal) exportModal.classList.remove('active');
                        showToast('PDF Exported Successfully!', 'success');
                    };
                    reader.readAsDataURL(blob);
                });
            } else {
                tempStyling.download({ name: fileName, extension: selectedExportFormat }).then(() => {
                    if (exportModal) exportModal.classList.remove('active');
                    showToast(`Exported as ${selectedExportFormat.toUpperCase()} (${selectedExportSize}px)!`, 'success');
                });
            }
        });
    }

    const copyDataBtn = document.getElementById('copyDataBtn');
    if (copyDataBtn) {
        copyDataBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentQRData) {
                navigator.clipboard.writeText(currentQRData).then(() => {
                    showToast('QR Data Copied to Clipboard!', 'success');
                }).catch(() => {
                    showToast('Failed to copy data', 'danger');
                });
            } else {
                showToast('Generate a QR code first!', 'warning');
            }
        });
    }

    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!currentQRData) {
                showToast('Generate a QR code first to share!', 'warning');
                return;
            }

            if (navigator.share) {
                navigator.share({
                    title: 'QR Forge - AviNav',
                    text: `Scan QR Code Data: ${currentQRData}`,
                    url: window.location.href
                }).then(() => showToast('Shared successfully!', 'success'))
                  .catch(() => {});
            } else {
                navigator.clipboard.writeText(currentQRData);
                showToast('Link copied to share!', 'info');
            }
        });
    }

    // =======================================
    // 9. QR Scanner Page Logic (html5-qrcode)
    // =======================================
    const readerElem = document.getElementById('reader');
    if (readerElem && typeof Html5Qrcode !== 'undefined') {
        let html5QrcodeScanner = new Html5Qrcode("reader");
        let isScanning = false;

        const tabCameraMode = document.getElementById('tabCameraMode');
        const tabUploadMode = document.getElementById('tabUploadMode');
        const cameraViewSection = document.getElementById('cameraViewSection');
        const uploadViewSection = document.getElementById('uploadViewSection');
        const cameraIdlePlaceholder = document.getElementById('cameraIdlePlaceholder');

        const startCamBtn = document.getElementById('startCamBtn');
        const stopCamBtn = document.getElementById('stopCamBtn');
        const scanResultCard = document.getElementById('scanResultCard');
        const scanResultText = document.getElementById('scanResultText');
        const scanResultBadge = document.getElementById('scanResultBadge');
        const openResultBtn = document.getElementById('openResultBtn');
        const copyResultBtn = document.getElementById('copyResultBtn');
        const shareResultBtn = document.getElementById('shareResultBtn');
        const fileScanInput = document.getElementById('fileScanInput');

        // Mode Switcher Listeners
        if (tabCameraMode && tabUploadMode) {
            tabCameraMode.addEventListener('click', () => {
                tabCameraMode.classList.add('active');
                tabUploadMode.classList.remove('active');
                if (cameraViewSection) cameraViewSection.classList.add('active');
                if (uploadViewSection) uploadViewSection.classList.remove('active');
            });

            tabUploadMode.addEventListener('click', () => {
                tabUploadMode.classList.add('active');
                tabCameraMode.classList.remove('active');
                if (uploadViewSection) uploadViewSection.classList.add('active');
                if (cameraViewSection) cameraViewSection.classList.remove('active');

                // Stop camera if running when switching to upload
                if (isScanning && html5QrcodeScanner) {
                    html5QrcodeScanner.stop().then(() => {
                        isScanning = false;
                        if (startCamBtn) startCamBtn.style.display = 'inline-flex';
                        if (stopCamBtn) stopCamBtn.style.display = 'none';
                        if (cameraIdlePlaceholder) cameraIdlePlaceholder.style.display = 'flex';
                        if (readerElem) readerElem.style.display = 'none';
                    }).catch(() => {});
                }
            });
        }

        function onScanSuccess(decodedText, decodedResult) {
            if (isScanning) {
                html5QrcodeScanner.stop().then(() => {
                    isScanning = false;
                    if (startCamBtn) startCamBtn.style.display = 'inline-flex';
                    if (stopCamBtn) stopCamBtn.style.display = 'none';
                    if (cameraIdlePlaceholder) cameraIdlePlaceholder.style.display = 'flex';
                    if (readerElem) readerElem.style.display = 'none';
                }).catch(() => {});
            }

            let detectedType = "Text";
            if (decodedText.startsWith('http://') || decodedText.startsWith('https://')) detectedType = "URL";
            else if (decodedText.startsWith('upi://')) detectedType = "UPI";
            else if (decodedText.includes('wa.me') || decodedText.startsWith('whatsapp:')) detectedType = "WhatsApp";
            else if (decodedText.startsWith('WIFI:')) detectedType = "WiFi";
            else if (decodedText.startsWith('mailto:')) detectedType = "Email";
            else if (decodedText.startsWith('tel:')) detectedType = "Phone";
            else if (decodedText.startsWith('geo:')) detectedType = "Location";
            else if (decodedText.startsWith('BEGIN:VCARD')) detectedType = "VCard";

            if (scanResultBadge) scanResultBadge.innerText = detectedType;
            if (scanResultText) scanResultText.innerText = decodedText;
            if (scanResultCard) scanResultCard.classList.add('active');

            if (openResultBtn) {
                if (detectedType === "URL" || detectedType === "WhatsApp") {
                    openResultBtn.style.display = 'inline-flex';
                    openResultBtn.onclick = () => window.open(decodedText, '_blank');
                } else if (detectedType === "UPI") {
                    openResultBtn.style.display = 'inline-flex';
                    openResultBtn.onclick = () => window.location.href = decodedText;
                } else {
                    openResultBtn.style.display = 'none';
                }
            }

            if (copyResultBtn) {
                copyResultBtn.onclick = () => {
                    navigator.clipboard.writeText(decodedText);
                    showToast('Scanned Data Copied!', 'success');
                };
            }

            if (shareResultBtn) {
                shareResultBtn.onclick = () => {
                    if (navigator.share) {
                        navigator.share({ title: 'Scanned QR Code', text: decodedText });
                    } else {
                        navigator.clipboard.writeText(decodedText);
                        showToast('Data copied for sharing', 'info');
                    }
                };
            }

            HistoryManager.save({
                type: `Scanned (${detectedType})`,
                title: getQRTitle(detectedType, decodedText),
                content: decodedText
            });

            showToast('QR Code Scanned Successfully!', 'success');
        }

        if (startCamBtn) {
            startCamBtn.addEventListener('click', () => {
                const cameraConfig = {
                    fps: 10,
                    qrbox: (viewfinderWidth, viewfinderHeight) => {
                        const minDim = Math.min(viewfinderWidth, viewfinderHeight);
                        return {
                            width: Math.floor(minDim * 0.75),
                            height: Math.floor(minDim * 0.75)
                        };
                    }
                };

                const startWithConfig = (camSpec) => {
                    if (cameraIdlePlaceholder) cameraIdlePlaceholder.style.display = 'none';
                    if (readerElem) readerElem.style.display = 'block';

                    html5QrcodeScanner.start(camSpec, cameraConfig, onScanSuccess)
                        .then(() => {
                            isScanning = true;
                            startCamBtn.style.display = 'none';
                            if (stopCamBtn) stopCamBtn.style.display = 'inline-flex';
                            showToast('Camera active. Point at any QR Code.', 'info');
                        })
                        .catch(err => {
                            console.error("Camera start error:", err);
                            // Fallback to default device enumeration
                            Html5Qrcode.getCameras().then(devices => {
                                if (devices && devices.length > 0) {
                                    html5QrcodeScanner.start(devices[0].id, cameraConfig, onScanSuccess)
                                        .then(() => {
                                            isScanning = true;
                                            startCamBtn.style.display = 'none';
                                            if (stopCamBtn) stopCamBtn.style.display = 'inline-flex';
                                            showToast('Camera active', 'info');
                                        }).catch(e => {
                                            showToast('Camera permission denied or camera unavailable', 'danger');
                                            if (cameraIdlePlaceholder) cameraIdlePlaceholder.style.display = 'flex';
                                            if (readerElem) readerElem.style.display = 'none';
                                        });
                                } else {
                                    showToast('No camera found on this device', 'danger');
                                    if (cameraIdlePlaceholder) cameraIdlePlaceholder.style.display = 'flex';
                                    if (readerElem) readerElem.style.display = 'none';
                                }
                            });
                        });
                };

                startWithConfig({ facingMode: "environment" });
            });
        }

        if (stopCamBtn) {
            stopCamBtn.addEventListener('click', () => {
                if (isScanning) {
                    html5QrcodeScanner.stop().then(() => {
                        isScanning = false;
                        startCamBtn.style.display = 'inline-flex';
                        stopCamBtn.style.display = 'none';
                        if (cameraIdlePlaceholder) cameraIdlePlaceholder.style.display = 'flex';
                        if (readerElem) readerElem.style.display = 'none';
                        showToast('Camera Stopped', 'info');
                    });
                }
            });
        }

        if (fileScanInput) {
            fileScanInput.addEventListener('change', (e) => {
                if (e.target.files.length === 0) return;
                const file = e.target.files[0];
                showToast('Scanning image file...', 'info');

                html5QrcodeScanner.scanFile(file, true)
                    .then(decodedText => {
                        onScanSuccess(decodedText);
                    })
                    .catch(err => {
                        console.warn("File scan decode error:", err);
                        showToast('No valid QR code detected in this image file', 'warning');
                    });
            });
        }
    }

    // =======================================
    // 10. QR History Page Controller
    // =======================================
    const historyGrid = document.getElementById('historyGrid');
    if (historyGrid) {
        const searchInput = document.getElementById('historySearchInput');
        const clearAllBtn = document.getElementById('clearHistoryBtn');
        let activeFilter = 'All';

        function renderHistory() {
            const allItems = HistoryManager.getAll();
            const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

            let filtered = allItems.filter(item => {
                if (activeFilter === 'Favorites' && !item.isFavorite) return false;
                if (activeFilter !== 'All' && activeFilter !== 'Favorites') {
                    if (!item.type.toLowerCase().includes(activeFilter.toLowerCase())) return false;
                }
                if (query) {
                    return item.title.toLowerCase().includes(query) || item.content.toLowerCase().includes(query);
                }
                return true;
            });

            historyGrid.innerHTML = '';

            if (filtered.length === 0) {
                historyGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px; color: var(--text-muted);">
                        <i class="fa-solid fa-clock-rotate-left" style="font-size: 48px; margin-bottom: 15px;"></i>
                        <h3>No QR History Found</h3>
                        <p>Generate or scan QR codes to see them saved here automatically.</p>
                    </div>
                `;
                return;
            }

            filtered.forEach(item => {
                const card = document.createElement('div');
                card.className = 'history-card clay-card fade-in-up';
                
                const formattedDate = new Date(item.date).toLocaleDateString(undefined, {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });

                card.innerHTML = `
                    <div class="history-card-top">
                        <div class="history-thumb">
                            <img src="${item.thumbnail || 'https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=' + encodeURIComponent(item.content)}" alt="QR Thumb">
                        </div>
                        <div class="history-info">
                            <span class="type-badge">${item.type}</span>
                            <h4>${item.title}</h4>
                            <p>${item.content}</p>
                            <div class="history-date">${formattedDate}</div>
                        </div>
                    </div>
                    <div class="history-actions">
                        <button class="fav-btn ${item.isFavorite ? 'active' : ''}" data-id="${item.id}">
                            <i class="fa-solid fa-star"></i>
                        </button>
                        <div style="display:flex; gap: 8px;">
                            <button class="clay-btn primary clay-btn-sm copy-hist-btn" data-content="${encodeURIComponent(item.content)}"><i class="fa-solid fa-copy"></i></button>
                            <button class="clay-btn danger clay-btn-sm del-hist-btn" data-id="${item.id}"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                `;
                historyGrid.appendChild(card);
            });

            document.querySelectorAll('.fav-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    const isFav = HistoryManager.toggleFav(id);
                    btn.classList.toggle('active', isFav);
                    showToast(isFav ? 'Added to Favorites!' : 'Removed from Favorites', 'info');
                });
            });

            document.querySelectorAll('.copy-hist-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const content = decodeURIComponent(btn.getAttribute('data-content'));
                    navigator.clipboard.writeText(content);
                    showToast('Copied to Clipboard!', 'success');
                });
            });

            document.querySelectorAll('.del-hist-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    HistoryManager.delete(id);
                    renderHistory();
                    showToast('Item deleted', 'info');
                });
            });
        }

        document.querySelectorAll('.filter-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                activeFilter = pill.getAttribute('data-filter');
                renderHistory();
            });
        });

        if (searchInput) searchInput.addEventListener('input', renderHistory);

        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                if (confirm("Are you sure you want to clear your entire QR history?")) {
                    HistoryManager.clearAll();
                    renderHistory();
                    showToast('History cleared!', 'info');
                }
            });
        }

        renderHistory();
    }
});
