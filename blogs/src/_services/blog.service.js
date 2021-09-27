import config from './../config';
import { authHeader } from '../_helpers';

export const blogService = {
    getById,
    update,
    getBlogs,
    delete: _delete,
    approveBlog,
    addBlog
};



function getById(id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/blogs/${id}`, requestOptions).then(handleResponse);
}

function update(user) {
    const requestOptions = {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    };

    return fetch(`${config.apiUrl}/blogs/${user.id}`, requestOptions).then(handleResponse);;
}

// prefixed function name with underscore because delete is a reserved word in javascript
function _delete(id) {
    const requestOptions = {
        method: 'DELETE',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/blogs/${id}`, requestOptions).then(handleResponse);
}

function getBlogs(id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/blogs`, requestOptions).then(handleResponse).then(data =>  {console.log('dd', data); return data.data});
}

function approveBlog(id) {
    const requestOptions = {
        method: 'PUT',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/blogs/approve/${id}`, requestOptions).then(handleResponse).then(data =>  {console.log('dd', data); return data.message});
}

function addBlog(data) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    };

    return fetch(`${config.apiUrl}/blogs`, requestOptions).then(handleResponse).then(data =>  {console.log('dd', data); return data.data});
}

function handleResponse(response) {
    return response.text().then(text => {
        const data = text && JSON.parse(text);
        if (!response.ok) {
            if (response.status === 401) {
                // auto logout if 401 response returned from api
                logout();
                location.reload(true);
            }

            const error = (data && data.message) || response.statusText;
            return Promise.reject(error);
        }

        return data;
    });
}