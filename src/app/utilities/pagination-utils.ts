/**
 * File: pagination-utils.ts
 * Description: Utilidad Angular para manejar la lógica de paginación y reinicio de datos.
 *              Funcionalidades:
 *                - Reiniciar datos cuando cambia la función actual.
 *                - Manejar eventos de cambio de página.
 *                - Actualizar tamaño de página dinámicamente.
 *                - Ejecutar paginación condicional según clave o estado.
 * 
 * Maintenance:
 *  - Last modified: 21-Oct-2025
 */

export class PaginationUtils {
    resetIfChanged<T>(currentFunction: any, functionDataCurrent: any, clearDataCallback: () => void): any {
        if (functionDataCurrent !== currentFunction) {
            clearDataCallback();  // Llama a la función de limpieza que se pasa desde el componente
        }
        return currentFunction;
    }

    // Método para manejar el cambio de página
    onPageChange(event: any, pageSize: any, functionCurrent: (pageSize: any) => void, pageKey: any) {
        pageSize = this.updatePageSize(event.pageSize, pageSize);
        this.paginationPage(pageSize, functionCurrent, pageKey);  // Pasamos pageKey a la función
    }

    onPageChangeTwo(event: any, pageSize: any, functionCurrent: (pageSize: any) => void, hasmore: any) {
        pageSize = this.updatePageSize(event.pageSize, pageSize);
        this.paginationPage(pageSize, functionCurrent, hasmore);  // Pasamos hasmore a la función
    }

    // Método que ejecuta la paginación
    paginationPage(pageSize: any, functionCurrent: (pageSize: any) => void, pageKey: any) {
        if (pageKey) {  // Validamos pageKey en lugar de pageSize
            functionCurrent(pageSize);
        }
    }

    updatePageSize(newPageSize: any, currentPageSize: any): any {
        const parsedCurrent = Number.parseInt(currentPageSize.toString(), 10);

        if (newPageSize > parsedCurrent) {
            return newPageSize;
        }

        return currentPageSize;
    }
}
