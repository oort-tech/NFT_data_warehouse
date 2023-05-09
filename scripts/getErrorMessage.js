//SPDX-License-Identifier: MIT

function getErrorMessage(error) {
    if (error instanceof Error) return error.message
    return String(error)
}

module.exports = getErrorMessage;
