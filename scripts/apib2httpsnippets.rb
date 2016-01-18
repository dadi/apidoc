#!/usr/bin/env ruby
# ./apib2httpsnippets
# Author: Max Novakovic
# Email:  max@lateral.io

require 'awesome_print'
require 'json'
require 'fileutils'
require 'uri'
json = JSON.parse(File.read(ARGV[0]), :max_nesting => false)['ast']
dir = File.expand_path(File.dirname(ARGV[0]))
api_name = File.basename(ARGV[0], ".json")
host = ARGV[1]

# Create directories for hars and snippets if doesn't exist
FileUtils.mkdir_p(dir + "/embeds")
FileUtils.mkdir_p(dir + "/hars")
FileUtils.mkdir_p(dir + "/snippets")

# Simple slug function
def slug(str)
  str.downcase.strip.gsub(' ', '-').gsub(/[^\w-]/, '')
end

# Get the first param value from the possible values
def first_param_val(param)
  first = param['values'][0]
  return '' unless first
  first['value']
  first['value'].to_i if param['type'] == 'integer'
end

# Get the API meta HOST
host = json['metadata'].find { |item| item['name'] == 'HOST' }['value']

# Step through each resourceGroup, resource and method
json['resourceGroups'].each do |rg|
  ap rg['name']
  rg['resources'].each do |r|
    ap "-- #{r['name']}"
    r['actions'].each do |action|
      ap "---- #{action['name']}"

      # Create the har object
      har = {}
      har['method'] = action['method']
      har['url'] = host + r['uriTemplate']

      # Need the Subscription-Key header for every request
      har['headers'] = [{ name: 'Authorization', value: 'Bearer YOUR_BEARER_TOKEN' }]

      # GET requests
      if har['method'] == 'GET'

        # Get the params and add them
        action['parameters'].map do |param|
          { 'name' => param['name'], 'value' => first_param_val(param) }
        end
      end

      puts har

      # POST or PUT requests
      if (har['method'] == 'POST' || har['method'] == 'PUT') && action['parameters'].count > 0

        har['postData'] = {
          'mimeType' => 'application/json',

          # Create a JSON object from all the params
          'text' => action['parameters'].each_with_object({}) do |param, hash|
            hash[param['name']] = first_param_val(param)
          end.to_json
        }

        # Use this if your API does not support application/json content type:
        # har['postData'] = {
        #   'text' => action['parameters'].map do |param|
        #     "#{param['name']}=#{first_param_val(param)}"
        #   end.join('&')
        # }
      end

      # Write the HAR to file
      name = "#{slug(rg['name'])}-#{slug(r['name'])}-#{slug(har['method'])}"
      File.open(dir + "/hars/#{name}.json", "w") do |f|
        f.truncate(0)
        f.write(har.to_json)
      end

      File.open(dir + "/embeds/#{name}.html", "w") do |f|
        f.truncate(0)
        embed = '<iframe src="//api.apiembed.com/?source=' + host + '/docs/hars/'+name+'.json&amp;targets=shell:curl,node:native,javascript:jquery,php:curl,python:requests,ruby:native,objc:nsurlsession" frameborder="0" scrolling="no" width="100%" height="500px" seamless></iframe>'
        f.write(embed)
      end
    end
  end
end

# There are more available! Modify as you see fit - http://git.io/vLwrr
targets = {
  'shell'      => ['curl'],
  #'go'         => ['native'],
  #'httpie'     => ['native'],
  #'java'       => ['okhttp'],
  'javascript' => ['jquery'],
  'node'       => ['native'],
  'objc'       => ['native'],
  #'ocaml'      => ['native'],
  'php'        => ['native'],
  'python'     => ['native'],
  'ruby'       => ['native']
}

# Loop through each target and generate the snippets
targets.each do |lang, value|
  value.each do |client|
    print "Outputting #{lang} #{client}: "
    ap `httpsnippet #{dir}/hars/*.json -t #{lang} -c #{client} -o #{dir}/snippets/#{lang}`
  end
end
