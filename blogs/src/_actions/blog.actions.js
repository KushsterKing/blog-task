import { blogConstants } from '../_constants';
import { blogService } from '../_services';
import { alertActions } from './';
import { history } from '../_helpers';

export const blogActions = {

    delete: _delete,
    getBlogs,
    approveBlog,
    addBlog
};


function getBlogs() {
    return dispatch => {
        dispatch(request());

        blogService.getBlogs()
            .then(
                blogs => {
                    dispatch(success(blogs))
                },
                error => { return dispatch(failure(error.toString()))}
            );
    };

    function request() { return { type: blogConstants.GETALL_REQUEST } }
    function success(blogs) { return { type: blogConstants.GETALL_SUCCESS, blogs } }
    function failure(error) { return { type: blogConstants.GETALL_FAILURE, error } }
}

function approveBlog(id){
    return dispatch => {
        dispatch(request(id));

        blogService.approveBlog(id)
            .then(
                blog => {
                    dispatch(success(id))
                    // history.push('/');
                    dispatch(alertActions.success('Blog approved'));
                },
                error => { console.log(error); return dispatch(failure(error.toString()))}
            );
    };

    function request() { return { type: blogConstants.APPRoVE_REQUEST, id } }
    function success(id) { return { type: blogConstants.APPROVE_SUCCESS, id } }
    function failure(error) { return { type: blogConstants.APPROVE_FAILURE, error } }
}

// prefixed function name with underscore because delete is a reserved word in javascript
function _delete(id) {
    return dispatch => {
        dispatch(request(id));

        blogService.delete(id)
            .then(
                blog => {
                    dispatch(success(id));
                    // history.push('/');
                    dispatch(alertActions.success('Blog deleted successfully'));
                },
                error => dispatch(failure(id, error.toString()))
            );
    };

    function request(id) { return { type: blogConstants.DELETE_REQUEST, id } }
    function success(id) { return { type: blogConstants.DELETE_SUCCESS, id } }
    function failure(id, error) { return { type: blogConstants.DELETE_FAILURE, id, error } }
}

function addBlog(data) {
    return dispatch => {
        dispatch(request());

        console.log('ss');

        blogService.addBlog(data)
            .then(
                blog => {
                    dispatch(success(blog));
                    history.push('/');
                    dispatch(alertActions.success('Blog added successfully'));
                },
                error => dispatch(failure(error.toString()))
            );
    };

    function request() { return { type: blogConstants.ADD_REQUEST } }
    function success(blog) { return { type: blogConstants.ADD_SUCCESS, blog } }
    function failure(error) { return { type: blogConstants.ADD_FAILURE, error } }
}