* {
    box-sizing: border-box;
}

body {
    margin: 0;
    font-family: 'Inter', sans-serif;
    background-color: #0a0a0a;
    color: #e5e5e5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    padding-bottom: 60px;
    min-height: 100vh;
}

.app {
    max-width: 500px;
    margin: 0 auto;
    padding: 20px;
    padding-bottom: 0;
}

/* Room Navigation */
.room-navigation {
    margin-bottom: 20px;
}

.room-tabs {
    display: flex;
    overflow-x: auto;
    gap: 10px;
    padding-bottom: 10px;
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.room-tabs::-webkit-scrollbar {
    display: none;
}

.room-tab {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #262626;
    color: #e5e5e5;
    /* Base size for room tabs */
    width: 80px; /* Fixed width */
    height: 70px; /* Fixed height */
    padding: 10px 6px; /* Adjust padding to fit content */
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
}

.room-tab:hover {
    background: #404040;
    transform: translateY(-2px);
}

.room-tab.active {
    background: #06b6d4;
    color: #000;
    font-weight: 600;
    /* Make the entire tab taller, keep width closer to original */
    width: 95px; /* Slightly wider than base, but not too broad */
    height: 120px; /* Significantly taller */
    padding: 20px 10px; /* More padding for larger size */
    transform: translateY(-5px); /* Pop out more */
    box-shadow: 0 8px 25px rgba(6, 182, 212, 0.3);
    z-index: 5; /* Ensure active tab is on top */
}

.room-tab .room-icon {
    font-size: 24px; /* Base icon size */
    margin-bottom: 4px;
    transition: all 0.3s ease;
}

.room-tab.active .room-icon {
    font-size: 48px; /* Significantly larger icon in active state to fill height */
    color: #000;
}

.room-tab span {
    font-size: 12px; /* Base text size */
    font-weight: inherit;
    transition: font-size 0.3s ease; /* Smooth transition for text size */
}

.room-tab.active span {
    font-size: 15px; /* Slightly larger text in active state */
}

/* Info Bar */
.info-bar {
    display: flex;
    justify-content: space-around;
    align-items: center;
    background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
    border-radius: 16px;
    padding: 16px 8px;
    margin-bottom: 20px;
    gap: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    border: 1px solid #333;
}

.info-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    color: #e5e5e5;
    text-align: center;
    padding: 8px;
    border-radius: 8px;
    transition: all 0.3s ease;
}

.info-item i {
    font-size: 20px;
    margin-bottom: 4px;
    transition: all 0.3s ease;
}

.info-item p {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
}

.action-item {
    background: transparent;
    border: none;
    cursor: pointer;
}

.action-item:hover {
    background: rgba(6, 182, 212, 0.1);
    color: #06b6d4;
    transform: translateY(-1px);
}

.action-item:hover i {
    color: #06b6d4;
    transform: scale(1.1);
}

/* Room Content */
.room-content {
    margin-bottom: 20px;
}

.room-content.hidden {
    display: none;
}

.room-section {
    background: linear-gradient(135deg, #1a1a1a, #262626);
    border-radius: 20px;
    padding: 24px;
    margin-bottom: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    border: 1px solid #333;
    position: relative;
    overflow: hidden;
    transition: all 0.5s ease;
}

.room-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, transparent, rgba(6, 182, 212, 0.05), transparent);
    opacity: 0;
    transition: opacity 0.5s ease;
    pointer-events: none;
}

.room-section.has-active-devices::before {
    opacity: 1;
}

.room-section.has-active-devices {
    background: linear-gradient(135deg, #1a1a1a, #1e2a3a, #1a1a1a);
    background-size: 200% 200%;
    animation: room-glow 8s ease-in-out infinite alternate;
}

@keyframes room-glow {
    0% { background-position: 0% 0%; }
    50% { background-position: 100% 100%; }
    100% { background-position: 0% 0%; }
}

.room-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.room-header h2 {
    font-size: 20px;
    margin: 0;
    color: #e5e5e5;
    font-weight: 600;
}

.settings-icon {
    font-size: 18px;
    color: #e5e5e5;
    cursor: pointer;
    transition: all 0.3s ease;
    padding: 8px;
    border-radius: 8px;
}

.settings-icon:hover {
    color: #06b6d4;
    background: rgba(6, 182, 212, 0.1);
    transform: rotate(90deg);
}

/* Device Grid */
.device-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 16px 8px;
    padding: 0 4px;
}

.device-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    flex-shrink: 0;
    width: calc(23% - 6px);
    max-width: 80px;
}

.device-circle {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #333;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
    cursor: pointer;
    position: relative;
    transition: all 0.3s ease;
    overflow: hidden;
    border: 2px solid transparent;
}

.device-circle:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.device-circle.active {
    background: #404040;
    border-color: #06b6d4;
    box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
}

.device-icon {
    font-size: 24px;
    color: #999;
    transition: all 0.3s ease;
    z-index: 2;
}

.device-circle.active .device-icon {
    color: #06b6d4;
    filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.6));
}

.device-label {
    font-size: 12px;
    color: #e5e5e5;
    margin: 0;
    line-height: 1.3;
    padding: 0 2px;
    font-weight: 500;
}

/* Light Effects */
.device-circle[data-device-type="light"].active .device-icon {
    animation: light-pulse 2s ease-in-out infinite alternate;
}

@keyframes light-pulse {
    0% {
        color: #06b6d4;
        filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.6));
    }
    100% {
        color: #0891b2;
        filter: drop-shadow(0 0 15px rgba(6, 182, 212, 0.8));
    }
}

/* Fan Specific Styles */
.fan-control .fan-speed-indicator {
    display: flex;
    gap: 2px;
    position: absolute;
    bottom: 8px;
    z-index: 3;
}

.speed-dot {
    width: 6px;
    height: 6px;
    background: rgba(153, 153, 153, 0.3);
    border-radius: 50%;
    transition: all 0.3s ease;
}

.fan-control.active .speed-dot.active-dot {
    background: #06b6d4;
    box-shadow: 0 0 8px rgba(6, 182, 212, 0.6);
    transform: scale(1.2);
}

.fan-control.active .fan-icon {
    animation: fan-spin linear infinite;
    color: #06b6d4;
    filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.6));
}

@keyframes fan-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

/* Bottom Navigation */
.bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #1a1a1a, #262626);
    display: flex;
    justify-content: space-around;
    padding: 8px 0;
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
    z-index: 1000;
    height: 60px;
    border-top: 1px solid #333;
}

.nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: #999;
    font-size: 12px;
    padding: 0;
    cursor: pointer;
    flex: 1;
    transition: all 0.3s ease;
    border-radius: 12px;
    margin: 4px;
}

.nav-item i {
    font-size: 18px;
    margin-bottom: 2px;
    transition: all 0.3s ease;
}

.nav-item.active {
    color: #06b6d4;
    background: rgba(6, 182, 212, 0.1);
}

.nav-item.active i {
    color: #06b6d4;
    transform: scale(1.1);
}

.nav-item:hover {
    color: #06b6d4;
    background: rgba(6, 182, 212, 0.05);
}

.nav-item:hover i {
    transform: scale(1.05);
}

/* Responsive Design */
@media (max-width: 480px) {
    .app {
        padding: 16px;
    }
    
    .room-tab {
        width: 70px; /* Adjusted fixed width for smaller screens */
        height: 60px; /* Adjusted fixed height for smaller screens */
        padding: 8px 4px;
    }

    .room-tab .room-icon {
        font-size: 22px;
    }

    .room-tab.active {
        width: 85px; /* Maintain narrow width for smaller screens */
        height: 85px; /* Adjusted taller active height for smaller screens */
        padding: 15px 8px;
    }

    .room-tab.active .room-icon {
        font-size: 40px; /* Adjusted larger icon size for smaller screens */
    }

    .device-item {
        width: calc(25% - 6px);
    }
    
    .device-circle {
        width: 55px;
        height: 55px;
    }
    
    .device-icon {
        font-size: 22px;
    }
}

@media (max-width: 360px) {
    .device-item {
        width: calc(33.33% - 8px);
    }
    
    .device-row {
        justify-content: center;
    }
}
