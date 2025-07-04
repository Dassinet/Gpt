export const metadata = {
    title: 'Google Authentication Callback',
    description: 'Processing Google authentication...',
};

export default function GoogleCallbackLayout({ children }) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {children}
        </div>
    );
} 