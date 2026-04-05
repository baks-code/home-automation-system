window.addEventListener('load', async () => {

    loadTemperatureAndHumidity();
    loadDeviceStates()
});
async function loadTemperatureAndHumidity(){
    try {
        const res = await fetch('/temperature');
        const data = await res.json();
        document.getElementById('temperature').textContent = `${data.temperature ? data.temperature : "-"}°C`;
        document.getElementById('humidity').textContent = `${data.humidity ? data.humidity : "-"}%`;
    } catch (err) {
        console.error('Could not fetch temperature:', err);
    }
}
async function loadDeviceStates() {
    try {
        const res = await fetch('/devices-state');
        const data = await res.json();

        Object.keys(data).forEach(device => {
            restoreDeviceState(device, data[device]);
        });

    } catch (err) {
        console.error("Failed to load device states", err);
    }
}
function restoreDeviceState(device, isOn) {
    const cfg = config[device];

    // save state
    state[device] = isOn;

    // Toggle pill
    const track = document.getElementById(cfg.toggleId);
    track.className = 'toggle-track ' + (isOn ? 'on' : 'off');

    // Card class
    const card = document.getElementById(cfg.cardId);
    card.classList.toggle('is-on', isOn);
    card.classList.toggle('is-off', !isOn);

    // Badge text
    const badge = document.getElementById(cfg.badgeId);
    badge.textContent = isOn ? 'On' : 'Off';
}


// ── State ──
const state = {
    mainLight: false,
    motionSensor: false,
    doorSensor: false
};

// Config per device
const config = {
    mainLight: {
        label: 'Main Light',
        location: 'Living Room',
        icon: 'light',
        cardId: 'main-light',
        toggleId: 'toggle-main-light',
        badgeId: 'badge-main-light',
    },
    motionSensor: {
        label: 'Motion Sensor',
        icon: 'sensors',
        cardId: 'motion-sensor',
        toggleId: 'toggle-motion-sensor',
        badgeId: 'badge-motion-sensor',
    },
    doorSensor: {
        label: 'Door Sensor',
        icon: 'sensors',
        cardId: 'door-sensor',
        toggleId: 'toggle-door-sensor',
        badgeId: 'badge-door-sensor'
    }
};

let pendingDevice = null;

// ── Request toggle (opens modal) ──
function requestToggle(device) {

    pendingDevice = device;
    const cfg = config[device];
    const isOn = state[device];
    const turningOn = !isOn;

    // Icon wrap
    const iconWrap = document.getElementById('modal-icon-wrap');
    iconWrap.className = 'modal-icon-wrap ' + (turningOn ? 'on' : 'off');
    document.getElementById('modal-icon').textContent = cfg.icon;

    // Title & description
    const action = turningOn ? 'Turn On' : 'Turn Off';
    document.getElementById('modal-title').textContent = `${action} ${cfg.label}?`;

    const descMap = {
        on: {
            mainLight: 'This will switch on main lights.',
            motionSensor: 'This will activate the Motion Sensor',
            doorSensor: 'This will activate the Door Sensor'
        },
        off: {
            mainLight: 'This will switch off the main lights.',
            motionSensor: 'This will deactivate the Motion Sensor',
            doorSensor: 'This will deactivate the Door Sensor'
        }
    };
    document.getElementById('modal-desc').textContent =
        turningOn ? descMap.on[device] : descMap.off[device];

    // Confirm button style
    const btn = document.getElementById('modal-confirm');
    btn.className = 'btn-confirm ' + (turningOn ? 'on' : 'off');
    btn.textContent = turningOn ? 'Turn On' : 'Turn Off';

    // Show modal
    document.getElementById('toggle-modal').classList.add('visible');
    document.body.style.overflow = 'hidden';
}

// ── Confirm toggle ──
function confirmToggle() {
    if (!pendingDevice) return;

    applyToggle(pendingDevice);
    closeModal();
}

// ── Cancel toggle ──
function cancelToggle() {
    pendingDevice = null;
    closeModal();
}

function closeModal() {
    document.getElementById('toggle-modal').classList.remove('visible');
    document.body.style.overflow = '';
}

async function applyToggle(device) {
    const isOn = !state[device];
    const cfg = config[device];

    const success = await sendAction(device, isOn);

    if (success) {
        state[device] = !state[device];

        // Toggle pill
        const track = document.getElementById(cfg.toggleId);
        track.className = 'toggle-track ' + (isOn ? 'on' : 'off');

        // Card class
        const card = document.getElementById(cfg.cardId);
        card.classList.toggle('is-on', isOn);
        card.classList.toggle('is-off', !isOn);

        // Badge text
        const badge = document.getElementById(cfg.badgeId);
        badge.textContent = isOn ? 'On' : 'Off';
    } else {
        alert('Failed to send action');
        return;
    }

}

// Escape key closes modal
document.addEventListener('keydown', e => { if (e.key === 'Escape') cancelToggle(); });


async function sendAction(deviceID, newState) {
    try {
        const res = await fetch('/action', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ device_ID: deviceID, new_State: newState })
        });

        if (!res.ok)
            return false
        else
            return true

    } catch (err) {
        console.error(err);
        return false
    }
}