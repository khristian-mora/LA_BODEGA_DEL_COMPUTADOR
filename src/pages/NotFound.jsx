import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, AlertTriangle } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center space-y-8"
      >
        <div className="relative">
          <motion.div 
            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
            className="flex justify-center"
          >
            <AlertTriangle className="h-24 w-24 text-red-500" />
          </motion.div>
          <h1 className="mt-6 text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500 drop-shadow-sm">
            404
          </h1>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            Página No Encontrada
          </h2>
          <p className="text-gray-500 text-lg">
            Lo sentimos, no pudimos encontrar la página que estás buscando. Puede que haya sido eliminada o la dirección sea incorrecta.
          </p>
        </div>

        <motion.div 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="pt-4"
        >
          <Link
            to="/"
            className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <Home className="mr-2 h-5 w-5" />
            Volver al Inicio
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;
