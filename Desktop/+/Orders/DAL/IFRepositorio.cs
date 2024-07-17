using DAL.Datos;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Data.Common;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace DAL
{
    public class IFRepositorio : IRepository
    {
        //Llmada  a la clase de contexto
        ApplicationDbContext _context;
        //Dispose
        private bool disposedValue;

        public async Task<TEntity> CreateAsync<TEntity>(TEntity toCreate) where TEntity : class 
        {
            TEntity Result = default(TEntity);
            try
            {
                await _context.Set<TEntity>().AddAsync(toCreate);
                await _context.SaveChangesAsync();
                Result = toCreate;
            }
            catch (DbException)
            {
                throw;
            }
            return Result;
        }
        
        public async Task<bool> DeleteAsync<TEntity>(TEntity toDelete) where TEntity : class
        {
            bool Result = false;
            try
            {
                _context.Entry<TEntity>(toDelete).State = EntityState.Deleted;
                Result = await _context.SaveChangesAsync() > 0;
            }
            catch (DbException)
            {
                throw;
            }
            return Result;
        }

        public void Dispose()
        {
            if(_context != null)
            {
                _context.Dispose();
            }
        }

        public async Task<List<TEntity>> FilterAsync<TEntity>(Expression<Func<TEntity, bool>> criteria) where TEntity : class
        {
            List<TEntity> Result = default(List<TEntity>);
            try
            {
                Result = await _context.Set<TEntity>().Where(criteria).ToListAsync();
            }
            catch (DbException)
            {
                throw;
            }
            return Result;
        }

        public async Task<TEntity> RetreiveAsync<TEntity>(Expression<Func<TEntity, bool>> criteria) where TEntity : class
        {
            TEntity Result = null;
            try
            {
                Result = await _context.Set<TEntity>().FirstOrDefaultAsync(criteria);
            }
            catch (DbException)
            {
                throw;
            }
            return Result;
        }

        public async Task<bool> UpdateAsync<TEntity>(TEntity toUpdate) where TEntity : class
        {
            bool Result = false;
            try
            {
                _context.Entry<TEntity>(toUpdate).State = EntityState.Modified;
                Result = await _context.SaveChangesAsync() > 0;
            }
            catch (DbException)
            {
                throw;
            }
            return Result;
        }
    }
}
