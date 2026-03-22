import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(_error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error', error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full border border-red-100">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 text-3xl font-bold">
                            !
                        </div>
                        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Algo salió mal</h2>
                        <p className="text-gray-600 text-center mb-6">
                            Ha ocurrido un error inesperado en la aplicación.
                        </p>

                        <details className="bg-gray-100 p-4 rounded text-xs text-red-600 font-mono overflow-auto max-h-40 mb-6">
                            {this.state.error && this.state.error.toString()}
                        </details>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-3 bg-gradient-to-r from-slate-800 to-black text-white rounded-lg hover:from-black hover:to-slate-800 transition-all font-medium shadow-lg"
                        >
                            Recargar Página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
