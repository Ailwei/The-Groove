"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDistanceFromLatLonInM = exports.deg2rad = void 0;
function deg2rad(deg) {
    return deg * (Math.PI / 180);
}
exports.deg2rad = deg2rad;
function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
exports.getDistanceFromLatLonInM = getDistanceFromLatLonInM;
