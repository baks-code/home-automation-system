// Device state management
const deviceStates = {};

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    setupRoomNavigation();
    setupBottomNavigation();
    setupDeviceControls();
    setupInfoBarActions();
    
    // Initialize with living room
    showRoom('living-room');
}

// Room Navigation
function setupRoomNavigation() {
    const roomTabs = document.querySelectorAll('.room-tab');
    
    roomTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const roomId = tab.dataset.room;
            
            // Update active tab
            roomTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show room content
            showRoom(roomId);
        });
    });
}

function showRoom(roomId) {
    const roomContents = document.querySelectorAll('.room-content');
    
    // Hide all rooms
    roomContents.forEach(content => {
        content.classList.add('hidden');
    });
    
    // Show selected room
    const activeRoom = document.getElementById(`${roomId}-content`);
    if (activeRoom) {
        activeRoom.classList.remove('hidden');
        updateRoomActiveState(activeRoom);
    }
}

function updateRoomActiveState(roomElement) {
    const roomSection = roomElement.querySelector('.room-section');
    const devices = roomElement.querySelectorAll('.device-circle');
    
    let hasActiveDevices = false;
    
    devices.forEach(device => {
        const deviceId = device.dataset.deviceId;
        const deviceType = device.dataset.deviceType;
        
        if (deviceType === 'fan') {
            const speed = parseInt(device.dataset.currentSpeed) || 0;
            if (speed > 0) hasActiveDevices = true;
        } else {
            if (deviceStates[deviceId]) hasActiveDevices = true;
        }
    });
    
    if (hasActiveDevices) {
        roomSection.classList.add('has-active-devices');
    } else {
        roomSection.classList.remove('has-active-devices');
    }
}

// Bottom Navigation
function setupBottomNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

// Device Controls
function setupDeviceControls() {
    const deviceCircles = document.querySelectorAll('.device-circle');
    
    deviceCircles.forEach(device => {
        device.addEventListener('click', () => {
            const deviceType = device.dataset.deviceType;
            const deviceId = device.dataset.deviceId;
            
            if (deviceType === 'fan') {
                handleFanControl(device, deviceId);
            } else {
                handleDeviceToggle(device, deviceId);
            }
            
            // Update room state
            const roomContent = device.closest('.room-content');
            updateRoomActiveState(roomContent);
        });
    });
}

async function handleDeviceToggle(deviceElement, deviceId) {
    const isCurrentlyActive = deviceStates[deviceId] || false;
    const newState = !isCurrentlyActive;
    
    deviceStates[deviceId] = newState;

   await sendAction(deviceId, !isCurrentlyActive);
    
    if (newState) {
        deviceElement.classList.add('active');
    } else {
        deviceElement.classList.remove('active');
    }
    
    console.log(`Device ID: ${deviceId}, State: ${newState ? 'ON' : 'OFF'}`);
}

async function sendAction(deviceID, newState) {
    fetch('/action', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ device_ID: deviceID, new_State: newState })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
    })
    .catch(err => console.error(err));
}

function handleFanControl(fanElement, deviceId) {
    let currentSpeed = parseInt(fanElement.dataset.currentSpeed) || 0;
    let newSpeed = (currentSpeed + 1) % 6; // 0-5 speed levels
    
    fanElement.dataset.currentSpeed = newSpeed;
    
    // Update fan visual state
    updateFanVisuals(fanElement, newSpeed);
    
    // Update device label
    updateFanLabel(fanElement, newSpeed);
    
    console.log(`Fan ID: ${deviceId}, Speed: ${newSpeed}`);
}

function updateFanVisuals(fanElement, speed) {
    const fanIcon = fanElement.querySelector('.fan-icon');
    const speedDots = fanElement.querySelectorAll('.speed-dot');
    
    // Remove all active states
    fanElement.classList.remove('active');
    speedDots.forEach(dot => dot.classList.remove('active-dot'));
    
    if (speed > 0) {
        // Add active state
        fanElement.classList.add('active');
        
        // Activate speed dots
        for (let i = 0; i < speed; i++) {
            if (speedDots[i]) {
                speedDots[i].classList.add('active-dot');
            }
        }
        
        // Set fan spin speed
        const spinDuration = Math.max(0.3, 1.2 - (speed * 0.15));
        fanIcon.style.animationDuration = `${spinDuration}s`;
    } else {
        // Remove animation
        fanIcon.style.animation = 'none';
        // Force reflow to restart animation when needed
        fanIcon.offsetHeight;
        fanIcon.style.animation = '';
    }
}

function updateFanLabel(fanElement, speed) {
    const deviceItem = fanElement.closest('.device-item');
    const label = deviceItem.querySelector('.device-label');
    const originalText = label.textContent.split(' (')[0]; // Get base text without speed info
    
    if (speed > 0) {
        label.textContent = `${originalText} (Speed ${speed})`;
    } else {
        label.textContent = originalText;
    }
}

// Info Bar Actions
function setupInfoBarActions() {
    const actionItems = document.querySelectorAll('.action-item');
    
    actionItems.forEach(item => {
        item.addEventListener('click', () => {
            const text = item.querySelector('p').textContent;
            console.log(`Info bar action clicked: ${text}`);
            
            // Add visual feedback
            item.style.transform = 'scale(0.95)';
            setTimeout(() => {
                item.style.transform = '';
            }, 150);
        });
    });
}

// Utility Functions
function getAllActiveDevices() {
    const activeDevices = [];
    
    // Regular devices
    Object.keys(deviceStates).forEach(deviceId => {
        if (deviceStates[deviceId]) {
            activeDevices.push({
                id: deviceId,
                type: 'toggle',
                state: 'on'
            });
        }
    });
    
    // Fan devices
    const fanControls = document.querySelectorAll('.fan-control');
    fanControls.forEach(fan => {
        const speed = parseInt(fan.dataset.currentSpeed) || 0;
        if (speed > 0) {
            activeDevices.push({
                id: fan.dataset.deviceId,
                type: 'fan',
                speed: speed
            });
        }
    });
    
    return activeDevices;
}

function resetAllDevices() {
    // Reset toggle devices
    Object.keys(deviceStates).forEach(deviceId => {
        deviceStates[deviceId] = false;
    });
    
    // Reset device visuals
    const deviceCircles = document.querySelectorAll('.device-circle:not(.fan-control)');
    deviceCircles.forEach(device => {
        device.classList.remove('active');
    });
    
    // Reset fans
    const fanControls = document.querySelectorAll('.fan-control');
    fanControls.forEach(fan => {
        fan.dataset.currentSpeed = '0';
        updateFanVisuals(fan, 0);
        updateFanLabel(fan, 0);
    });
    
    // Update all room states
    const roomContents = document.querySelectorAll('.room-content');
    roomContents.forEach(room => {
        updateRoomActiveState(room);
    });
    
    console.log('All devices reset');
}

// Expose utility functions globally for debugging
window.smartHome = {
    getAllActiveDevices,
    resetAllDevices,
    deviceStates
};
