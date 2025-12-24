'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 dark:bg-gray-900">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
              {/* Critical Error Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-red-600 dark:text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">
                심각한 오류가 발생했습니다
              </h1>

              <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                애플리케이션을 로드하는 중 치명적인 문제가 발생했습니다.
              </p>

              <details className="mb-6">
                <summary className="cursor-pointer text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 font-medium">
                  오류 세부사항
                </summary>
                <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Error:
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 break-words">
                    {error.message}
                  </p>
                  {error.digest && (
                    <>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Error ID:
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                        {error.digest}
                      </p>
                    </>
                  )}
                </div>
              </details>

              <div className="flex flex-col gap-3">
                <button
                  onClick={reset}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  애플리케이션 재시작
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
                >
                  홈으로 이동
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-6">
                문제가 지속되면 브라우저를 새로고침하거나 관리자에게 문의하세요.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
