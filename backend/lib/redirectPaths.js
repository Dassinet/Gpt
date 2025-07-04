const ROLES = {
    ADMIN: 'admin',
    USER: 'user',
};

const getRedirectPath = (role) => {
    switch (role) {
        case ROLES.ADMIN:
            return '/admin/dashboard';
        case ROLES.USER:
            return '/user/dashboard';
        default:
            return '/auth/sign-in';
    }
};

module.exports = {
    ROLES,
    getRedirectPath
}; 