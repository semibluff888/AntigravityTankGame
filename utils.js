const Utils = {
    // Check collision between two circles
    circleCollision: (c1, c2) => {
        const dx = c1.x - c2.x;
        const dy = c1.y - c2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < c1.radius + c2.radius;
    },

    // Check collision between circle and rectangle (for walls if we add them later)
    rectCircleCollision: (circle, rect) => {
        const distX = Math.abs(circle.x - rect.x - rect.w / 2);
        const distY = Math.abs(circle.y - rect.y - rect.h / 2);

        if (distX > (rect.w / 2 + circle.radius)) { return false; }
        if (distY > (rect.h / 2 + circle.radius)) { return false; }

        if (distX <= (rect.w / 2)) { return true; }
        if (distY <= (rect.h / 2)) { return true; }

        const dx = distX - rect.w / 2;
        const dy = distY - rect.h / 2;
        return (dx * dx + dy * dy <= (circle.radius * circle.radius));
    },

    // Random range
    randomRange: (min, max) => {
        return Math.random() * (max - min) + min;
    },
    
    // Clamp value
    clamp: (value, min, max) => {
        return Math.min(Math.max(value, min), max);
    }
};
